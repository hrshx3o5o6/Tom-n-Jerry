'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { makeProject, readLog } = require('./helpers');

const load = name => import(path.join(__dirname, '..', 'adapters', name));

// ─── opencode ────────────────────────────────────────────────────────────────

async function opencode(root) {
  const prompts = [];
  const client = { session: { promptAsync: async req => { prompts.push(req); } } };
  const { TomNJerry } = await load('opencode.mjs');
  return { h: await TomNJerry({ client, directory: root }), prompts };
}

async function system(h, sid = 's1') {
  const out = { system: [] };
  await h['experimental.chat.system.transform']({ sessionID: sid, model: {} }, out);
  return out.system.join('\n');
}

test('opencode: loop summary rides on the system prompt every call', async () => {
  const root = makeProject();
  const { h } = await opencode(root);
  await h['chat.message']({ sessionID: 's1' }, { message: {}, parts: [{ type: 'text', text: 'add a new api route' }] });
  const s = await system(h);
  assert.match(s, /Jerry: when the action adds a dependency/);
  assert.match(s, /api-jerry/);
  assert.match(await system(h), /Tom n Jerry/, 'summary persists across calls in the turn');
});

test('opencode: Jerry finding is delivered on the next model call, once', async () => {
  const root = makeProject();
  const { h } = await opencode(root);
  await h['chat.message']({ sessionID: 's1' }, { parts: [{ type: 'text', text: 'x' }] });
  await h['tool.execute.before']({ tool: 'bash', sessionID: 's1', callID: 'c1' }, { args: { command: 'npm i express-rate-limit' } });
  assert.match(await system(h), /already a dependency/);
  assert.doesNotMatch(await system(h), /already a dependency/);
});

test('opencode: enforce mode throws to block the tool', async () => {
  const root = makeProject({ config: { mode: 'enforce' } });
  const { h } = await opencode(root);
  await assert.rejects(
    h['tool.execute.before']({ tool: 'bash', sessionID: 's1', callID: 'c1' }, { args: { command: 'npm i express-rate-limit' } }),
    /enforce mode/,
  );
});

test('opencode: edits + session.idle → one receipt follow-up prompt', async () => {
  const root = makeProject();
  const { h, prompts } = await opencode(root);
  await h['chat.message']({ sessionID: 's1' }, { parts: [{ type: 'text', text: 'x' }] });
  await h['tool.execute.after']({ tool: 'write', sessionID: 's1', callID: 'c1', args: { filePath: path.join(root, 'src/a.js') } }, { title: '', output: '', metadata: {} });
  await h.event({ event: { type: 'session.idle', properties: { sessionID: 's1' } } });
  await h.event({ event: { type: 'session.idle', properties: { sessionID: 's1' } } });
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].path.id, 's1');
  assert.match(prompts[0].body.parts[0].text, /Receipt/);
});

test('opencode: bash exit code and apply_patch paths reach the log', async () => {
  const root = makeProject();
  const { h } = await opencode(root);
  await h['tool.execute.after']({ tool: 'bash', sessionID: 's1', callID: 'c1', args: { command: 'npm test' } }, { output: 'ok', metadata: { exit: 3 } });
  await h['tool.execute.after']({ tool: 'apply_patch', sessionID: 's1', callID: 'c2', args: { patchText: '*** Begin Patch\n*** Add File: src/b.ts\n+x\n*** End Patch' } }, { output: '', metadata: {} });
  const log = readLog(root, 's1');
  assert.equal(log.find(e => e.e === 'shell').exit, 3);
  assert.equal(log.find(e => e.e === 'edit').path, 'src/b.ts');
});

// ─── Pi ──────────────────────────────────────────────────────────────────────

async function pi(root) {
  const { default: ext } = await load('pi.mjs');
  const handlers = {};
  ext({ on: (name, fn) => { handlers[name] = fn; } });
  const ctx = { cwd: root, sessionManager: { getSessionId: () => 'p1' } };
  return { on: (name, event) => handlers[name](event, ctx), handlers };
}

test('pi: registers the five lifecycle events', async () => {
  const { handlers } = await pi(makeProject());
  assert.deepEqual(Object.keys(handlers).sort(), ['agent_before_settle', 'before_agent_start', 'session_start', 'tool_call', 'tool_result']);
});

test('pi: before_agent_start writes a system prompt section', async () => {
  const root = makeProject();
  const { on } = await pi(root);
  const event = { prompt: 'add a new api route', systemPrompt: 'base', systemPromptOptions: { sections: {} } };
  assert.equal(await on('before_agent_start', event), undefined);
  assert.match(event.systemPromptOptions.sections.tom_n_jerry, /api-jerry/);
  const legacy = await on('before_agent_start', { prompt: 'x', systemPrompt: 'base' });
  assert.match(legacy.systemPrompt, /^base\n\n\[Tom n Jerry\]/);
});

test('pi: advise finding appended to the tool result; enforce blocks', async () => {
  const root = makeProject();
  const { on } = await pi(root);
  assert.equal(await on('tool_call', { toolName: 'bash', toolCallId: 't1', input: { command: 'npm i express-rate-limit' } }), undefined);
  const res = await on('tool_result', {
    toolName: 'bash', toolCallId: 't1', input: { command: 'npm i express-rate-limit' },
    content: [{ type: 'text', text: 'added 1 package' }], structuredContent: { output: '', truncated: false, exit_code: 0 }, isError: false,
  });
  assert.equal(res.content[0].text, 'added 1 package');
  assert.match(res.content[1].text, /already a dependency/);

  const strict = makeProject({ config: { mode: 'enforce' } });
  const p2 = await pi(strict);
  const blocked = await p2.on('tool_call', { toolName: 'bash', toolCallId: 't1', input: { command: 'npm i express-rate-limit' } });
  assert.equal(blocked.block, true);
});

test('pi: agent_before_settle continues once with a visible message', async () => {
  const root = makeProject();
  const { on } = await pi(root);
  await on('before_agent_start', { prompt: 'x', systemPrompt: '', systemPromptOptions: { sections: {} } });
  await on('tool_result', { toolName: 'write', toolCallId: 't2', input: { path: 'src/a.js' }, content: [], isError: false });
  const settle = { entries: [], continue: false, context: { canContinue: true }, outcome: 'completed' };
  const r = await on('agent_before_settle', settle);
  assert.equal(r.continue, true);
  assert.equal(r.entries[0].type, 'custom_message');
  assert.match(r.entries[0].content, /Receipt/);
  assert.equal(await on('agent_before_settle', settle), undefined);
  assert.equal(await on('agent_before_settle', { ...settle, context: { canContinue: false } }), undefined);
});

test('adapters fail open on garbage input', async () => {
  const root = makeProject();
  const { h } = await opencode(root);
  await h['chat.message'](null, null);
  await h.event({});
  await h['tool.execute.after']({}, null);
  const { on } = await pi(root);
  assert.equal(await on('tool_result', null), undefined);
  assert.ok(fs.existsSync(path.join(root, '.tnj')));
});
