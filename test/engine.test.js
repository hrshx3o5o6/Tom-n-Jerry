'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { handle } = require('../core/engine');
const { makeProject, readLog, NO_ENV } = require('./helpers');

const CAPS = { toolContext: true, sessionStart: true };

function ev(root, event, extra = {}) {
  return handle({ event, harness: 'claude', sessionId: 's1', cwd: root, capabilities: CAPS, ...extra }, NO_ENV);
}
const shell = command => ({ tool: { kind: 'shell', name: 'Bash', command } });
const edit = (...paths) => ({ tool: { kind: 'edit', name: 'Edit', paths } });

test('repo without .tnj: notice on sessionStart only, writes nothing', () => {
  const root = makeProject({ tnj: false });
  assert.match(ev(root, 'sessionStart').context, /no \.tnj\//);
  assert.deepEqual(ev(root, 'prompt', { prompt: 'hi' }), {});
  assert.deepEqual(ev(root, 'toolBefore', shell('npm i express-rate-limit')), {});
  assert.equal(fs.existsSync(path.join(root, '.tnj')), false);
});

test('sessionStart injects the full loop summary', () => {
  const root = makeProject();
  assert.match(ev(root, 'sessionStart').context, /Jerry: when the action adds a dependency/);
});

test('prompt injects compact context with matched skills', () => {
  const root = makeProject();
  const out = ev(root, 'prompt', { prompt: 'install a package for date formatting' });
  assert.match(out.context, /Loop active/);
  assert.match(out.context, /dependency-jerry: \.tnj\/skills\/dependency-jerry\/SKILL\.md/);
  assert.doesNotMatch(out.context, /Prefer reuse/);
});

test('advise mode: Jerry adds context and lets the install run', () => {
  const root = makeProject();
  const out = ev(root, 'toolBefore', shell('npm install express-rate-limit'));
  assert.equal(out.block, undefined);
  assert.match(out.context, /express-rate-limit` is already a dependency \(package\.json:\d+\)/);
  const jerry = readLog(root, 's1').filter(e => e.e === 'jerry');
  assert.equal(jerry.length, 1);
  assert.equal(jerry[0].delivered, true);
});

test('enforce mode blocks direct deps but only advises on transitive/native', () => {
  const root = makeProject({ config: { mode: 'enforce' } });
  assert.match(ev(root, 'toolBefore', shell('npm i express-rate-limit')).block.reason, /enforce mode/);
  const soft = ev(root, 'toolBefore', shell('npm i debug uuid'));
  assert.equal(soft.block, undefined);
  assert.match(soft.context, /transitive/);
  assert.match(soft.context, /randomUUID/);
});

test('off mode does nothing', () => {
  const root = makeProject({ config: { mode: 'off' } });
  assert.deepEqual(ev(root, 'toolBefore', shell('npm i express-rate-limit')), {});
  assert.deepEqual(ev(root, 'sessionStart'), {});
});

test('non-shell tools and unrelated commands are ignored by Jerry', () => {
  const root = makeProject();
  assert.deepEqual(ev(root, 'toolBefore', edit('src/a.js')), {});
  assert.deepEqual(ev(root, 'toolBefore', shell('npm test')), {});
});

test('receipt gate: code edit without verification nudges once', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'add rate limiting' });
  ev(root, 'toolAfter', edit('src/index.js'));
  const first = ev(root, 'stop');
  assert.match(first.continue.reason, /Receipt/);
  assert.deepEqual(ev(root, 'stop'), {});
});

test('receipt gate: verification after the edit satisfies it', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolAfter', edit('src/index.js'));
  ev(root, 'toolAfter', { ...shell('npm test'), result: { output: 'ok', exitCode: 0 } });
  assert.deepEqual(ev(root, 'stop'), {});
  const receipts = fs.readFileSync(path.join(root, '.tnj', 'receipts.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].cmd, 'npm test');
  assert.equal(receipts[0].exit, 0);
});

test('receipt gate: read-only commands do not count as verification', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolAfter', edit('src/index.js'));
  ev(root, 'toolAfter', shell('ls -la && git status && cat src/index.js | head'));
  assert.match(ev(root, 'stop').continue.reason, /Receipt/);
});

test('receipt gate ignores .tnj state, docs and config edits', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolAfter', edit('.tnj/loop-state.json', 'README.md', 'package.json', '../outside.js'));
  assert.deepEqual(ev(root, 'stop'), {});
  assert.equal(readLog(root, 's1').filter(e => e.e === 'edit').length, 0);
});

test('stop_hook_active never continues', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolAfter', edit('src/index.js'));
  assert.deepEqual(ev(root, 'stop', { stopHookActive: true }), {});
});

test('receipt nudge re-arms only after a new edit', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolAfter', edit('src/index.js'));
  assert.ok(ev(root, 'stop').continue);
  ev(root, 'prompt', { prompt: 'y' });
  assert.deepEqual(ev(root, 'stop'), {});
  ev(root, 'toolAfter', edit('src/other.js'));
  assert.ok(ev(root, 'stop').continue);
});

test('teacher nudges once per session after Jerry findings', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolBefore', shell('npm i express-rate-limit'));
  assert.match(ev(root, 'stop').continue.reason, /Teacher: Jerry found 1 shortcut/);
  ev(root, 'prompt', { prompt: 'y' });
  assert.deepEqual(ev(root, 'stop'), {});
});

test('receipt beats teacher; one continue per turn', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolBefore', shell('npm i express-rate-limit'));
  ev(root, 'toolAfter', edit('src/index.js'));
  assert.match(ev(root, 'stop').continue.reason, /Receipt/);
  assert.deepEqual(ev(root, 'stop'), {});
  ev(root, 'prompt', { prompt: 'y' });
  assert.match(ev(root, 'stop').continue.reason, /Teacher/);
});

test('writing a learning suppresses the teacher nudge', () => {
  const root = makeProject();
  ev(root, 'prompt', { prompt: 'x' });
  ev(root, 'toolBefore', shell('npm i express-rate-limit'));
  ev(root, 'toolAfter', edit('.tnj/learnings/rate-limit.md'));
  assert.deepEqual(ev(root, 'stop'), {});
});

test('harness without tool context: findings deferred to the next prompt', () => {
  const root = makeProject();
  const caps = { toolContext: false, sessionStart: true };
  assert.deepEqual(ev(root, 'toolBefore', { ...shell('npm i express-rate-limit'), capabilities: caps }), {});
  const next = ev(root, 'prompt', { prompt: 'continue', capabilities: caps });
  assert.match(next.context, /Jerry findings since your last message/);
  const again = ev(root, 'prompt', { prompt: 'more', capabilities: caps });
  assert.doesNotMatch(again.context, /Jerry findings/);
});

test('harness with after-tool delivery gets findings on the tool result', () => {
  const root = makeProject();
  const caps = { toolContext: false, deliverAfterTool: true, sessionStart: true };
  ev(root, 'toolBefore', { ...shell('npm i express-rate-limit'), capabilities: caps });
  const after = ev(root, 'toolAfter', { ...shell('npm i express-rate-limit'), capabilities: caps });
  assert.match(after.context, /already a dependency/);
});

test('no session id: sessionStart rotates current-session', () => {
  const root = makeProject();
  handle({ event: 'sessionStart', cwd: root, capabilities: CAPS }, NO_ENV);
  const sid = fs.readFileSync(path.join(root, '.tnj', 'current-session'), 'utf8').trim();
  assert.match(sid, /^[0-9a-f]{16}$/);
  handle({ event: 'prompt', cwd: root, prompt: 'x', capabilities: CAPS }, NO_ENV);
  assert.equal(readLog(root, sid).length, 1);
});

test('root resolves from a subdirectory cwd and from CLAUDE_PROJECT_DIR', () => {
  const root = makeProject();
  fs.mkdirSync(path.join(root, 'src', 'deep'), { recursive: true });
  const out = handle({ event: 'toolBefore', sessionId: 's1', cwd: path.join(root, 'src', 'deep'), capabilities: CAPS, ...shell('npm i express-rate-limit') }, NO_ENV);
  assert.match(out.context, /already a dependency/);
  const out2 = handle({ event: 'toolBefore', sessionId: 's1', cwd: '/', capabilities: CAPS, ...shell('npm i express-rate-limit') }, { CLAUDE_PROJECT_DIR: root });
  assert.match(out2.context, /already a dependency/);
});

test('fails open on corrupt state and logs the error', () => {
  const root = makeProject();
  fs.writeFileSync(path.join(root, '.tnj', 'index.json'), '{not json');
  fs.mkdirSync(path.join(root, '.tnj', 'sessions'), { recursive: true });
  fs.writeFileSync(path.join(root, '.tnj', 'sessions', 's1.jsonl'), 'garbage\n{"e":"prompt"}\n');
  assert.ok(ev(root, 'prompt', { prompt: 'x' }).context);
  assert.deepEqual(handle(null), {});
  assert.deepEqual(handle({ event: 'nope' }), {});
});

test('old session logs are cleaned up on sessionStart', () => {
  const root = makeProject();
  const dir = path.join(root, '.tnj', 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  const old = path.join(dir, 'old.jsonl');
  fs.writeFileSync(old, '{}\n');
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
  fs.utimesSync(old, tenDaysAgo, tenDaysAgo);
  ev(root, 'sessionStart');
  assert.equal(fs.existsSync(old), false);
});
