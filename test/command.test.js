'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { runHook } = require('../adapters/command');
const { makeProject, readLog, REPO, NO_ENV } = require('./helpers');

const BIN = path.join(REPO, 'bin', 'tomnjerry.js');

function run(root, argv, payload) {
  const out = runHook(argv, JSON.stringify({ session_id: 's1', cwd: root, ...payload }), NO_ENV);
  return out ? JSON.parse(out) : null;
}

test('claude PreToolUse advise → additionalContext', () => {
  const root = makeProject();
  const out = run(root, ['toolBefore', '--dialect', 'claude', '--harness', 'claude'], {
    hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm install express-rate-limit' },
  });
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.match(out.hookSpecificOutput.additionalContext, /already a dependency/);
});

test('claude PreToolUse enforce → permissionDecision deny', () => {
  const root = makeProject({ config: { mode: 'enforce' } });
  const out = run(root, ['toolBefore', '--dialect', 'claude', '--harness', 'claude'], {
    hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm i express-rate-limit' },
  });
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /enforce/);
});

test('claude UserPromptSubmit and SessionStart → additionalContext', () => {
  const root = makeProject();
  const p = run(root, ['prompt', '--harness', 'claude'], { hook_event_name: 'UserPromptSubmit', prompt: 'add a new route' });
  assert.equal(p.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  const s = run(root, ['sessionStart', '--harness', 'claude'], { hook_event_name: 'SessionStart', source: 'startup' });
  assert.match(s.hookSpecificOutput.additionalContext, /Tom n Jerry/);
});

test('claude Stop → decision block with reason; stop_hook_active → nothing', () => {
  const root = makeProject();
  run(root, ['prompt', '--harness', 'claude'], { hook_event_name: 'UserPromptSubmit', prompt: 'x' });
  run(root, ['toolAfter', '--harness', 'claude'], {
    hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: path.join(root, 'src/a.js') }, tool_response: {},
  });
  assert.equal(run(root, ['stop', '--harness', 'claude'], { hook_event_name: 'Stop', stop_hook_active: true }), null);
  const out = run(root, ['stop', '--harness', 'claude'], { hook_event_name: 'Stop', stop_hook_active: false });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /Receipt/);
});

test('PostToolUse produces no output', () => {
  const root = makeProject();
  assert.equal(run(root, ['toolAfter', '--harness', 'claude'], {
    hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'npm test' }, tool_response: { stdout: 'ok' },
  }), null);
});

test('mismatched hook_event_name is ignored (misconfiguration must not act)', () => {
  const root = makeProject();
  assert.equal(run(root, ['toolBefore', '--harness', 'claude'], {
    hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'npm i express-rate-limit' },
  }), null);
});

test('bad input never throws and prints nothing', () => {
  assert.equal(runHook(['toolBefore', '--harness', 'claude'], '{not json'), '');
  assert.equal(runHook(['bogus', '--harness', 'claude'], '{}'), '');
  assert.equal(runHook(['toolBefore', '--harness', 'nope'], '{}'), '');
  assert.equal(runHook([], ''), '');
});

test('codex apply_patch edits are tracked by path', () => {
  const root = makeProject();
  const patch = '*** Begin Patch\n*** Update File: src/index.js\n@@\n-a\n+b\n*** Add File: src/new.ts\n+x\n*** End Patch';
  run(root, ['toolAfter', '--harness', 'codex'], { hook_event_name: 'PostToolUse', tool_name: 'apply_patch', tool_input: { input: patch } });
  const edits = readLog(root, 's1').filter(e => e.e === 'edit').map(e => e.path);
  assert.deepEqual(edits.sort(), ['src/index.js', 'src/new.ts']);
});

test('codex shell argv arrays are understood', () => {
  const root = makeProject();
  const out = run(root, ['toolBefore', '--harness', 'codex'], {
    hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: ['bash', '-lc', 'npm i express-rate-limit'] },
  });
  assert.match(out.hookSpecificOutput.additionalContext, /already a dependency/);
});

test('hermes: prompt → {context}; pre_tool_call advise defers; block uses decision/reason', () => {
  const root = makeProject();
  const pre = run(root, ['toolBefore', '--harness', 'hermes'], {
    hook_event_name: 'pre_tool_call', tool_name: 'terminal', tool_input: { command: 'npm i express-rate-limit' },
  });
  assert.equal(pre, null);
  const p = run(root, ['prompt', '--harness', 'hermes'], { hook_event_name: 'pre_llm_call', extra: { user_message: 'go on' } });
  assert.match(p.context, /Jerry findings since your last message/);

  const enforced = makeProject({ config: { mode: 'enforce' } });
  const b = run(enforced, ['toolBefore', '--harness', 'hermes'], {
    hook_event_name: 'pre_tool_call', tool_name: 'terminal', tool_input: { command: 'npm i express-rate-limit' },
  });
  assert.equal(b.decision, 'block');
});

test('bin: hook subcommand works end to end over stdin/stdout', () => {
  const root = makeProject();
  const res = spawnSync(process.execPath, [BIN, 'hook', 'toolBefore', '--dialect', 'claude', '--harness', 'claude'], {
    input: JSON.stringify({ session_id: 's1', cwd: root, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm i express-rate-limit' } }),
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  assert.equal(res.status, 0);
  assert.equal(res.stderr.toString(), '');
  assert.match(JSON.parse(res.stdout.toString()).hookSpecificOutput.additionalContext, /already a dependency/);
});

test('concurrency: 20 parallel toolAfter hooks → 20 intact log lines', async () => {
  const root = makeProject();
  await Promise.all(Array.from({ length: 20 }, (_, i) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, 'hook', 'toolAfter', '--harness', 'claude'], { env: { PATH: process.env.PATH } });
    child.on('error', reject);
    child.on('close', resolve);
    child.stdin.end(JSON.stringify({
      session_id: 'par', cwd: root, hook_event_name: 'PostToolUse', tool_name: 'Bash',
      tool_input: { command: `npm test -- --shard=${i}` }, tool_response: { stdout: 'x'.repeat(400) },
    }));
  })));
  const lines = readLog(root, 'par');
  assert.equal(lines.filter(e => e.e === 'shell').length, 20);
});
