'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { handle } = require('../core/engine');
const { stats, collect } = require('../cli/stats');
const { byId } = require('../cli/harnesses');
const { makeProject, REPO, NO_ENV } = require('./helpers');

const json = rel => JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8'));
const pkg = json('package.json');

test('stats summarises what the loop did', () => {
  const root = makeProject({ config: { mode: 'enforce' } });
  const ev = (event, extra) => handle({ event, sessionId: 's', cwd: root, harness: 'claude', capabilities: { toolContext: true }, ...extra }, NO_ENV);
  ev('prompt', { prompt: 'x' });
  ev('toolBefore', { tool: { kind: 'shell', command: 'npm i express-rate-limit uuid' } });
  ev('toolAfter', { tool: { kind: 'edit', paths: ['src/a.js'] } });
  ev('stop');
  ev('toolAfter', { tool: { kind: 'shell', command: 'npm test' }, result: { exitCode: 1 } });
  const s = collect(root);
  assert.equal(s.sessions, 1);
  assert.equal(s.jerry.duplicateInstallsCaught, 1);
  assert.equal(s.jerry.nativeAlternativesSuggested, 1);
  assert.equal(s.jerry.installsBlocked, 1);
  assert.deepEqual(s.jerry.packages, ['express-rate-limit', 'uuid']);
  assert.equal(s.receipts.failedCommands, 1);
  assert.equal(s.receipts.nudges, 1);
  const logs = [];
  assert.equal(stats(['--json'], { cwd: root, log: m => logs.push(m) }), 0);
  assert.equal(JSON.parse(logs[0]).turns, 1);
  assert.equal(stats([], { cwd: makeProject({ tnj: false }), log: () => {} }), 1);
});

test('every manifest path exists and ships in the npm package', () => {
  const files = pkg.files;
  const shipped = rel => files.some(f => rel.replace(/^\.\//, '').startsWith(f));
  const paths = [
    json('.claude-plugin/plugin.json').skills, json('.claude-plugin/plugin.json').hooks,
    json('.codex-plugin/plugin.json').skills, json('.codex-plugin/plugin.json').hooks,
    ...pkg.pi.extensions, ...pkg.pi.skills, pkg.main,
  ];
  for (const p of paths) {
    assert.ok(fs.existsSync(path.join(REPO, p)), `${p} exists`);
    assert.ok(shipped(p), `${p} is in package.json files`);
  }
  assert.equal(json('.claude-plugin/plugin.json').version, pkg.version);
  assert.equal(json('.codex-plugin/plugin.json').version, pkg.version);
});

test('plugin hooks cover the same events setup writes, pointing at the plugin root', () => {
  for (const [file, harness, rootVar] of [
    ['integrations/claude/hooks.json', 'claude', '${CLAUDE_PLUGIN_ROOT}'],
    ['integrations/codex/hooks.json', 'codex', '$PLUGIN_ROOT'],
  ]) {
    const hooks = json(file).hooks;
    const home = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tnj-home-'));
    byId(harness).install({ home, root: home });
    const setupEvents = Object.keys(JSON.parse(fs.readFileSync(
      harness === 'claude' ? path.join(home, '.claude', 'settings.json') : path.join(home, '.codex', 'hooks.json'), 'utf8')).hooks);
    assert.deepEqual(Object.keys(hooks).sort(), setupEvents.sort(), file);
    for (const groups of Object.values(hooks)) {
      for (const h of groups[0].hooks) {
        assert.ok(h.command.startsWith(`node "${rootVar}/bin/tomnjerry.js" hook `), h.command);
        assert.match(h.command, new RegExp(`--harness ${harness}$`));
      }
    }
  }
});

test('package main is the opencode plugin (opencode.json "plugin": ["@hrshx3o5o6/tomnjerry"])', async () => {
  const mod = await import(path.join(REPO, pkg.main));
  const fns = Object.values(mod);
  assert.ok(fns.length > 0 && fns.every(f => typeof f === 'function'), 'opencode requires every export to be a plugin function');
  assert.equal(new Set(fns).size, 1, 'named and default exports are the same function, so opencode dedupes them');
});

test('Pi package extension loads and registers handlers', async () => {
  const { default: ext } = await import(path.join(REPO, pkg.pi.extensions[0]));
  const names = [];
  ext({ on: n => names.push(n) });
  assert.ok(names.includes('tool_call'));
});

test('npm pack ships runtime files only', () => {
  const res = spawnSync('npm', ['pack', '--dry-run', '--json'], { cwd: REPO, encoding: 'utf8' });
  const list = JSON.parse(res.stdout)[0].files.map(f => f.path);
  assert.ok(list.includes('core/engine.js'));
  assert.ok(list.includes('.claude-plugin/plugin.json'));
  assert.ok(list.includes('tnj/skills/tom-core/SKILL.md'));
  assert.ok(!list.some(f => f.startsWith('test/') || f.startsWith('docs/superpowers') || f.startsWith('benchmarks/')));
});
