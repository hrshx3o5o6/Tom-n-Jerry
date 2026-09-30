'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { setup, remove } = require('../cli/setup');
const { checkHooks } = require('../cli/doctor');
const { hookCommand, binPath } = require('../cli/fsutil');
const { mergeIndex } = require('../cli/scaffold');
const { tmpdir, write, makeProject } = require('./helpers');

const quiet = () => {};
const run = (fn, argv, home, cwd) => fn(argv, { home, cwd, env: { PATH: '' }, interactive: false, log: quiet });
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const backups = dir => fs.readdirSync(dir).filter(f => f.includes('.tnj-backup-'));

test('setup wires Claude Code, Codex and Hermes and scaffolds the project', async () => {
  const home = tmpdir();
  const root = makeProject({ tnj: false });
  assert.equal(await run(setup, ['--harness', 'claude,codex,hermes'], home, root), 0);

  const claude = readJSON(path.join(home, '.claude', 'settings.json'));
  assert.deepEqual(Object.keys(claude.hooks).sort(), ['PostToolUse', 'PostToolUseFailure', 'PreToolUse', 'SessionStart', 'Stop', 'UserPromptSubmit']);
  const pre = claude.hooks.PreToolUse[0];
  assert.equal(pre.matcher, 'Bash');
  assert.match(pre.hooks[0].command, /^"[^"]+" "[^"]+tomnjerry\.js" hook toolBefore --dialect claude --harness claude$/);

  const codex = readJSON(path.join(home, '.codex', 'hooks.json'));
  assert.match(codex.hooks.PostToolUse[0].matcher, /apply_patch/);
  assert.match(codex.hooks.Stop[0].hooks[0].command, /--harness codex$/);

  const hermes = fs.readFileSync(path.join(home, '.hermes', 'config.yaml'), 'utf8');
  assert.match(hermes, /pre_llm_call:\n    - command: '.*hook prompt --dialect claude --harness hermes'/);
  assert.match(hermes, /matcher: 'terminal'/);

  assert.ok(fs.existsSync(path.join(home, '.claude', 'skills', 'tnj-dependency-jerry', 'SKILL.md')));
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'tnj-tom-core', 'SKILL.md'), 'utf8'), /^---\nname: tnj-tom-core\n/);
  assert.ok(fs.existsSync(path.join(home, '.hermes', 'skills', 'tnj-git-jerry', 'SKILL.md')));

  const tnj = path.join(root, '.tnj');
  assert.ok(fs.existsSync(path.join(tnj, 'skills', 'jerry-core', 'SKILL.md')));
  assert.match(fs.readFileSync(path.join(tnj, '.gitignore'), 'utf8'), /sessions\/\nreceipts\.jsonl\nerrors\.log\ncurrent-session/);
  assert.equal(readJSON(path.join(tnj, 'config.json')).mode, 'advise');
});

test('setup merges into existing configs, is idempotent, and remove restores them', async () => {
  const home = tmpdir();
  const root = makeProject({ tnj: false });
  const original = {
    theme: 'dark',
    hooks: {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'my-own-linter' }] }],
      Notification: [{ hooks: [{ type: 'command', command: 'say done' }] }],
    },
  };
  const settings = write(home, '.claude/settings.json', original);
  const hermesOriginal = 'model: x\nterminal:\n  backend: local\n';
  const hermesFile = write(home, '.hermes/config.yaml', hermesOriginal);

  await run(setup, ['--harness', 'claude,hermes', '--no-project'], home, root);
  const after = readJSON(settings);
  assert.equal(after.theme, 'dark');
  assert.equal(after.hooks.PreToolUse.length, 2);
  assert.equal(after.hooks.PreToolUse[0].hooks[0].command, 'my-own-linter');
  assert.equal(backups(path.dirname(settings)).length, 1);

  const snapshot = fs.readFileSync(settings, 'utf8');
  await run(setup, ['--harness', 'claude,hermes', '--no-project'], home, root);
  assert.equal(fs.readFileSync(settings, 'utf8'), snapshot);
  assert.equal(backups(path.dirname(settings)).length, 1, 'no backup when nothing changes');

  await run(remove, ['--harness', 'claude,hermes'], home, root);
  assert.deepEqual(readJSON(settings), original);
  assert.equal(fs.readFileSync(hermesFile, 'utf8'), hermesOriginal);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'skills', 'tnj-tom-core')), false);
});

test('hermes config with its own hooks: key is left untouched', async () => {
  const home = tmpdir();
  const text = 'hooks:\n  pre_tool_call:\n    - command: my-guard\n';
  const file = write(home, '.hermes/config.yaml', text);
  const logs = [];
  const code = await setup(['--harness', 'hermes', '--no-project'], { home, cwd: home, env: { PATH: '' }, interactive: false, log: m => logs.push(m) });
  assert.equal(code, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), text);
  assert.match(logs.join('\n'), /already has a top-level "hooks:" key/);
});

test('--project-hooks writes Claude hooks to settings.local.json in the repo', async () => {
  const home = tmpdir();
  const root = makeProject({ tnj: false });
  await run(setup, ['--harness', 'claude', '--project-hooks'], home, root);
  assert.ok(fs.existsSync(path.join(root, '.claude', 'settings.local.json')));
  assert.equal(fs.existsSync(path.join(home, '.claude', 'settings.json')), false);
  await run(remove, ['--harness', 'claude'], home, root);
  assert.deepEqual(readJSON(path.join(root, '.claude', 'settings.local.json')), {});
});

test('invalid JSON config is reported, not overwritten', async () => {
  const home = tmpdir();
  const file = write(home, '.claude/settings.json', '{ broken');
  const logs = [];
  await setup(['--harness', 'claude', '--no-project'], { home, cwd: home, env: { PATH: '' }, interactive: false, log: m => logs.push(m) });
  assert.equal(fs.readFileSync(file, 'utf8'), '{ broken');
  assert.match(logs.join('\n'), /not valid JSON/);
});

test('unknown harness is rejected', async () => {
  assert.equal(await run(setup, ['--harness', 'vim'], tmpdir(), tmpdir()), 1);
});

test('re-scaffolding keeps registered learnings and drops usageCount', () => {
  const merged = mergeIndex(
    { skills: [{ id: 'tom-core', path: 'skills/tom-core.md', usageCount: 4 }, { id: 'my-learning', path: 'learnings/x.md' }] },
    { version: '3', skills: [{ id: 'tom-core', path: 'skills/tom-core/SKILL.md', trigger: 'every-turn' }, { id: 'git-jerry', path: 'skills/git-jerry/SKILL.md' }] },
  );
  assert.deepEqual(merged.skills.map(s => s.id), ['tom-core', 'my-learning', 'git-jerry']);
  assert.equal(merged.skills[0].path, 'skills/tom-core/SKILL.md');
  assert.equal(merged.skills[0].usageCount, undefined);
});

test('doctor runs every installed hook for real and catches a broken install', async () => {
  const home = tmpdir();
  await run(setup, ['--harness', 'claude,codex,hermes', '--no-project'], home, home);
  assert.equal(checkHooks({ home, root: home, log: quiet }), true);

  const settings = path.join(home, '.claude', 'settings.json');
  write(home, '.claude/settings.json', fs.readFileSync(settings, 'utf8').replace(/tomnjerry\.js/g, 'gone.js'));
  const logs = [];
  assert.equal(checkHooks({ home, root: home, log: m => logs.push(m) }), false);
  assert.match(logs.join('\n'), /tomnjerry not found/);
});

test('opencode + Pi: shims installed, legacy AGENTS.md block removed, doctor smoke passes, remove cleans up', async () => {
  const home = tmpdir();
  const agents = write(home, '.config/opencode/AGENTS.md', '# Mine\n\n<!-- tnj-global-begin -->\nold protocol\n<!-- tnj-global-end -->\n\n# Also mine\n');
  await run(setup, ['--harness', 'opencode,pi', '--no-project'], home, home);

  const ocShim = path.join(home, '.config', 'opencode', 'plugins', 'tomnjerry.js');
  const piShim = path.join(home, '.pi', 'agent', 'extensions', 'tomnjerry.js');
  assert.match(fs.readFileSync(ocShim, 'utf8'), /export \{ TomNJerry \} from "file:.*adapters\/opencode\.mjs"/);
  assert.match(fs.readFileSync(piShim, 'utf8'), /export \{ default \} from "file:.*adapters\/pi\.mjs"/);
  assert.equal(fs.readFileSync(agents, 'utf8'), '# Mine\n\n# Also mine\n');
  assert.ok(fs.existsSync(path.join(home, '.agents', 'skills', 'tnj-tom-core', 'SKILL.md')));

  const logs = [];
  assert.equal(checkHooks({ home, root: home, log: m => logs.push(m) }), true, logs.join('\n'));
  assert.match(logs.join('\n'), /✔ opencode/);
  assert.match(logs.join('\n'), /✔ Pi/);

  await run(remove, ['--harness', 'opencode,pi'], home, home);
  assert.equal(fs.existsSync(ocShim), false);
  assert.equal(fs.existsSync(piShim), false);
});

test('Gemini CLI + Antigravity: configs written in their own shapes; doctor smoke passes', async () => {
  const home = tmpdir();
  write(home, '.gemini/config/hooks.json', { 'my-linter': { PostToolUse: [{ matcher: 'run_command', hooks: [{ command: './lint.sh' }] }] } });
  await run(setup, ['--harness', 'gemini,agy', '--no-project'], home, home);

  const g = readJSON(path.join(home, '.gemini', 'settings.json'));
  assert.equal(g.hooks.BeforeTool[0].matcher, 'run_shell_command');
  assert.equal(g.hooks.BeforeTool[0].hooks[0].timeout, 10000, 'Gemini timeouts are milliseconds');
  assert.equal(g.hooks.AfterAgent[0].hooks[0].name, 'tomnjerry-stop');

  const a = readJSON(path.join(home, '.gemini', 'config', 'hooks.json'));
  assert.ok(a['my-linter'], 'other hook entries preserved');
  assert.equal(a.tomnjerry.PreInvocation[0].type, 'command', 'invocation handlers sit directly under the event');
  assert.equal(a.tomnjerry.PreToolUse[0].hooks[0].timeout, 10, 'Antigravity timeouts are seconds');

  const logs = [];
  assert.equal(checkHooks({ home, root: home, log: m => logs.push(m) }), true, logs.join('\n'));

  await run(remove, ['--harness', 'agy'], home, home);
  assert.deepEqual(Object.keys(readJSON(path.join(home, '.gemini', 'config', 'hooks.json'))), ['my-linter']);
});

test('remove keeps shared ~/.agents/skills while another harness still uses them', async () => {
  const home = tmpdir();
  await run(setup, ['--harness', 'codex,gemini', '--no-project'], home, home);
  const skill = path.join(home, '.agents', 'skills', 'tnj-tom-core', 'SKILL.md');
  await run(remove, ['--harness', 'gemini'], home, home);
  assert.ok(fs.existsSync(skill), 'Codex still needs them');
  await run(remove, ['--harness', 'codex'], home, home);
  assert.equal(fs.existsSync(skill), false);
});

test('remove never deletes a user file that happens to share the shim name', async () => {
  const home = tmpdir();
  const mine = write(home, '.config/opencode/plugins/tomnjerry.js', 'export const Mine = async () => ({});\n');
  await run(remove, ['--harness', 'opencode'], home, home);
  assert.ok(fs.existsSync(mine));
});

test('generated commands survive paths with spaces', () => {
  const dir = path.join(tmpdir(), 'dir with spaces');
  fs.mkdirSync(dir);
  const link = path.join(dir, 'tomnjerry.js');
  fs.symlinkSync(binPath(), link);
  const root = makeProject();
  const cmd = hookCommand('toolBefore', 'claude', 'claude', { bin: link });
  const res = spawnSync(cmd, {
    shell: true, encoding: 'utf8',
    input: JSON.stringify({ session_id: 's', cwd: root, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm i express-rate-limit' } }),
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /already a dependency/);
});
