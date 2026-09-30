'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');
const { HARNESSES, byId } = require('./harnesses');
const { scaffoldProject } = require('./scaffold');
const { binPath } = require('./fsutil');
const { findRoot } = require('../core/root');

const PKG_NAME = '@hrshx3o5o6/tomnjerry';

function parseFlags(argv) {
  const f = { harness: null, yes: false, projectHooks: false, project: null, mode: null, purge: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--harness' || a === '--harnesses') f.harness = String(argv[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
    else if (a.startsWith('--harness=')) f.harness = a.slice(10).split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--yes' || a === '-y') f.yes = true;
    else if (a === '--project-hooks') f.projectHooks = true;
    else if (a === '--project') f.project = true;
    else if (a === '--no-project') f.project = false;
    else if (a === '--mode') f.mode = argv[++i];
    else if (a === '--purge') f.purge = true;
    else if (a === '--all') f.harness = HARNESSES.map(h => h.id);
  }
  return f;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

function isEphemeral(bin = binPath()) {
  return bin.includes(`${path.sep}_npx${path.sep}`);
}

function inProject(root) {
  return fs.existsSync(path.join(root, '.git')) || fs.existsSync(path.join(root, 'package.json'));
}

function validate(ids, log) {
  const unknown = ids.filter(id => !byId(id));
  if (unknown.length) {
    log(`✖ Unknown harness: ${unknown.join(', ')}. Supported: ${HARNESSES.map(h => h.id).join(', ')}`);
    return false;
  }
  return true;
}

async function setup(argv, {
  home = os.homedir(), env = process.env, cwd = process.cwd(),
  interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY), log = console.log,
} = {}) {
  const flags = parseFlags(argv);
  if (flags.mode && !['advise', 'enforce', 'off'].includes(flags.mode)) {
    log(`✖ --mode must be advise, enforce or off`);
    return 1;
  }

  if (isEphemeral()) {
    log('ℹ You are running tomnjerry through npx. Hooks need a permanent install to point at.');
    const ok = flags.yes || (interactive && /^y(es)?$/i.test(await ask(`Install ${PKG_NAME} globally now? [y/N] `)));
    if (!ok) {
      log(`\nRun these instead:\n  npm i -g ${PKG_NAME}\n  tomnjerry setup`);
      return 1;
    }
    const inst = spawnSync('npm', ['i', '-g', PKG_NAME], { stdio: 'inherit', shell: process.platform === 'win32' });
    if (inst.status !== 0) { log('✖ Global install failed.'); return 1; }
    const again = spawnSync('tomnjerry', ['setup', ...argv], { stdio: 'inherit', shell: process.platform === 'win32' });
    return again.status == null ? 1 : again.status;
  }

  log('🐭 Tom n Jerry setup\n');
  const detected = HARNESSES.filter(h => h.detect({ home, env })).map(h => h.id);
  log(`Detected: ${detected.length ? detected.map(id => byId(id).label).join(', ') : 'none'}`);

  let selected = flags.harness;
  if (!selected && interactive) {
    const answer = await ask(`Harnesses to wire (${HARNESSES.map(h => h.id).join(', ')}) [${detected.join(',') || 'none'}]: `);
    selected = answer ? answer.split(',').map(s => s.trim()).filter(Boolean) : detected;
  }
  if (!selected) selected = detected;
  if (!validate(selected, log)) return 1;
  if (!selected.length) {
    log(`\n✖ No harness selected. Pass --harness ${HARNESSES.map(h => h.id).join(',')}`);
    return 1;
  }

  const root = findRoot(cwd, {});
  let scaffold = flags.project;
  if (scaffold == null) {
    scaffold = inProject(root)
      && (!interactive || flags.yes || !/^n/i.test(await ask(`Enable Tom n Jerry in this project (${root})? [Y/n] `)));
  }

  const notes = [];
  const manual = [];
  let failed = false;

  if (scaffold) {
    const changed = scaffoldProject(root, { mode: flags.mode });
    log(`\n✔ Project: ${path.join(root, '.tnj')} ${changed.length ? `(${changed.length} files updated)` : '(up to date)'}`);
  } else if (flags.mode) {
    log('ℹ --mode applies to a project; pass --project to scaffold one.');
  }

  const scope = flags.projectHooks ? 'this project' : 'all projects (inert where there is no .tnj/)';
  log(`\nWiring hooks for ${scope}:`);
  for (const id of selected) {
    const h = byId(id);
    try {
      const res = h.install({ home, root, projectHooks: flags.projectHooks && id !== 'hermes' });
      if (res.manual) {
        manual.push(`${h.label}: ${res.manual}`);
        log(`  ⚠ ${h.label}: needs a manual step (see below)`);
      } else {
        log(`  ✔ ${h.label}${res.changed.length ? '' : ' (already up to date)'}`);
      }
      notes.push(...(res.notes || []));
      if (flags.projectHooks && id === 'hermes') notes.push('Hermes has no per-project hook config; its hooks were installed globally.');
    } catch (err) {
      failed = true;
      log(`  ✖ ${h.label}: ${err.message}`);
    }
  }

  if (manual.length) log(`\nManual steps:\n${manual.map(m => `  - ${m}`).join('\n')}`);
  if (notes.length) log(`\nBefore first use:\n${notes.map(n => `  - ${n}`).join('\n')}`);
  log(`\nVerify: tomnjerry doctor${scaffold ? '' : '\nEnable a project later: cd <project> && tomnjerry setup --project'}`);
  return failed ? 1 : 0;
}

async function remove(argv, { home = os.homedir(), cwd = process.cwd(), log = console.log } = {}) {
  const flags = parseFlags(argv);
  const ids = flags.harness || HARNESSES.map(h => h.id);
  if (!validate(ids, log)) return 1;
  const root = findRoot(cwd, {});
  for (const id of ids) {
    const h = byId(id);
    const { changed } = h.uninstall({ home, root });
    log(`${changed.length ? '✔' : 'ℹ'} ${h.label}: ${changed.length ? 'removed' : 'nothing to remove'}`);
  }
  if (flags.purge) {
    const tnj = path.join(root, '.tnj');
    if (fs.existsSync(tnj)) {
      fs.rmSync(tnj, { recursive: true, force: true });
      log(`✔ Deleted ${tnj}`);
    }
  }
  return 0;
}

module.exports = { setup, remove, parseFlags, isEphemeral };
