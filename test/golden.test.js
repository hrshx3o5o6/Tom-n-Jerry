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
