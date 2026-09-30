'use strict';

// Replays hook payloads in order through the real command adapter.
// claude/: captured from a live Claude Code session.
// codex/, hermes/: built field-for-field from the harnesses' own source
// (codex-rs/hooks/schema/generated, hermes agent/shell_hooks.py).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runHook } = require('../adapters/command');
const { makeProject, NO_ENV } = require('./helpers');

function replay(harness) {
  const dir = path.join(__dirname, 'fixtures', harness);
  const root = makeProject();
  const out = {};
  for (const file of fs.readdirSync(dir).sort()) {
    const event = file.replace(/^\d+-|\.json$/g, '');
    const text = fs.readFileSync(path.join(dir, file), 'utf8').split('{{ROOT}}').join(root);
    const stdout = runHook([event, '--harness', harness], text, NO_ENV);
    out[file.replace(/\.json$/, '')] = stdout ? JSON.parse(stdout) : null;
  }
  return { out, root };
}

test('claude (live capture): Jerry advises, receipt gate fires once, stop_hook_active respected', () => {
  const { out } = replay('claude');
  assert.equal(out['00-sessionStart'].hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(out['01-prompt'].hookSpecificOutput.additionalContext, /dependency-jerry/);
  assert.match(out['02-toolBefore'].hookSpecificOutput.additionalContext, /express-rate-limit` is already a dependency/);
  assert.equal(out['03-toolAfter'], null);
  assert.equal(out['04-stop'].decision, 'block');
  assert.match(out['04-stop'].reason, /Receipt/);
  assert.equal(out['08-stop'], null);
});

test('codex (source schema): apply_patch edit + text exit code tracked; stop contract', () => {
  const { out, root } = replay('codex');
  assert.match(out['02-toolBefore'].hookSpecificOutput.additionalContext, /already a dependency/);
  assert.match(out['04-stop'].reason, /Receipt/);
  assert.equal(out['06-stop'], null);
  const receipts = fs.readFileSync(path.join(root, '.tnj', 'receipts.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(receipts[0].cmd, 'npm test');
  assert.equal(receipts[0].exit, 0);
});

test('gemini (docs/hooks/reference.md): advisory finding appended after the tool, AfterAgent retry', () => {
  const { out, root } = replay('gemini');
  assert.equal(out['00-sessionStart'].hookSpecificOutput.hookEventName, 'SessionStart');
  assert.equal(out['01-prompt'].hookSpecificOutput.hookEventName, 'BeforeAgent');
  assert.equal(out['02-toolBefore'], null, 'BeforeTool has no context channel');
  assert.equal(out['03-toolAfter'].hookSpecificOutput.hookEventName, 'AfterTool');
  assert.match(out['03-toolAfter'].hookSpecificOutput.additionalContext, /already a dependency/);
  assert.equal(out['04-toolAfter'], null);
  assert.equal(out['05-stop'].decision, 'deny');
  assert.match(out['05-stop'].reason, /Receipt/);
  assert.equal(out['06-stop'], null);
  const receipts = fs.readFileSync(path.join(root, '.tnj', 'receipts.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(receipts[0].exit, 0);
});

test('agy (antigravity.google/docs/hooks): one turn per invocation 0, silent PreToolUse, Stop continue', () => {
  const { out, root } = replay('agy');
  assert.match(out['00-prompt'].injectSteps[0].ephemeralMessage, /Jerry: when the action adds a dependency/);
  assert.equal(out['01-toolBefore'], null, 'never emit allow: that would auto-approve the tool');
  assert.match(out['02-prompt'].injectSteps[0].ephemeralMessage, /already a dependency/);
  assert.equal(out['04-stop'].decision, 'continue');
  assert.match(out['04-stop'].reason, /Receipt/);
  assert.equal(out['05-prompt'], null);
  const log = fs.readFileSync(path.join(root, '.tnj', 'sessions', 'ec33ebf9-0cba-4100-8142-c61503f6c587.jsonl'), 'utf8');
  assert.equal(log.split('\n').filter(l => l.includes('"e":"prompt"')).length, 1, 'mid-turn invocations do not start turns');
});

test('agy (live capture): full loop — Jerry mid-turn, receipt, teacher once, then quiet', () => {
  const dir = path.join(__dirname, 'fixtures', 'agy-live');
  const root = makeProject();
  const out = {};
  for (const file of fs.readdirSync(dir).sort()) {
    const event = file.replace(/^\d+-|\.json$/g, '');
    const text = fs.readFileSync(path.join(dir, file), 'utf8').split('{{ROOT}}').join(root);
    const stdout = runHook([event, '--dialect', 'agy', '--harness', 'agy'], text, NO_ENV);
    out[file.replace(/\.json$/, '')] = stdout ? JSON.parse(stdout) : null;
  }
  assert.match(out['05-prompt'].injectSteps[0].ephemeralMessage, /already a dependency/);
  assert.match(out['08-stop'].reason, /Receipt/);
  assert.match(out['13-stop'].reason, /Teacher/);
  assert.equal(out['15-stop'], null);
  assert.equal(out['01-toolAfter'], null, 'PostToolUse with an empty toolCall is ignored');
});

test('agy enforce: PreToolUse deny; fullyIdle=false never continues', () => {
  const root = makeProject({ config: { mode: 'enforce' } });
  const base = { conversationId: 'c1', workspacePaths: [root] };
  const deny = JSON.parse(runHook(['toolBefore', '--harness', 'agy'], JSON.stringify({ ...base, toolCall: { name: 'run_command', args: { CommandLine: 'npm i express-rate-limit', Cwd: root } } }), NO_ENV));
  assert.deepEqual(Object.keys(deny).sort(), ['decision', 'reason']);
  assert.equal(deny.decision, 'deny');
  runHook(['toolAfter', '--harness', 'agy'], JSON.stringify({ ...base, toolCall: { name: 'write_to_file', args: { TargetFile: `${root}/src/x.js` } } }), NO_ENV);
  assert.equal(runHook(['stop', '--harness', 'agy'], JSON.stringify({ ...base, fullyIdle: false }), NO_ENV), '');
});

test('hermes (source schema): context shape, deferred Jerry finding, pre_verify continue', () => {
  const { out } = replay('hermes');
  assert.equal(out['00-sessionStart'], null);
  assert.match(out['01-prompt'].context, /Jerry: when the action adds a dependency/);
  assert.match(out['01-prompt'].context, /trap-jerry/);
  assert.doesNotMatch(out['05-prompt'].context, /Prefer reuse/);
  assert.equal(out['02-toolBefore'], null);
  assert.equal(out['04-stop'].decision, 'block');
  assert.match(out['05-prompt'].context, /Jerry findings since your last message/);
});
