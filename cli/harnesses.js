'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');
const {
  readJson, readText, writeJson, writeWithBackup, hookCommand, isTnjCommand, commandPaths, onPath,
} = require('./fsutil');
const { installSkillCopies, removeSkillCopies } = require('./scaffold');

// ─── Claude-style hooks.json / settings.json ─────────────────────────────────

function stripTnjGroups(groups) {
  if (!Array.isArray(groups)) return groups;
  return groups
    .map(g => {
      const hooks = Array.isArray(g.hooks) ? g.hooks : [];
      const kept = hooks.filter(h => !isTnjCommand(h && h.command));
      return { g: kept.length === hooks.length ? g : { ...g, hooks: kept }, hadTnj: kept.length !== hooks.length, empty: kept.length === 0 };
    })
    .filter(x => !(x.hadTnj && x.empty))
    .map(x => x.g);
}

function mergeJsonHooks(data, ours) {
  const out = { ...data };
  const hooks = { ...(data.hooks && typeof data.hooks === 'object' ? data.hooks : {}) };
  for (const ev of Object.keys(hooks)) {
    const stripped = stripTnjGroups(hooks[ev]);
    if (Array.isArray(stripped) && stripped.length === 0) delete hooks[ev];
    else hooks[ev] = stripped;
  }
  for (const [ev, groups] of Object.entries(ours || {})) {
    hooks[ev] = [...(hooks[ev] || []), ...groups];
  }
  if (Object.keys(hooks).length) out.hooks = hooks;
  else delete out.hooks;
  return out;
}

function tnjCommandsByEvent(data) {
  const found = {};
  const hooks = (data && data.hooks) || {};
  for (const [ev, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) continue;
    for (const g of groups) {
      for (const h of (g && g.hooks) || []) {
        if (isTnjCommand(h && h.command)) (found[ev] = found[ev] || []).push(h.command);
      }
    }
  }
  return found;
}

function commandProblems(commands) {
  const problems = [];
  for (const cmd of commands) {
    const p = commandPaths(cmd);
    if (!p) continue;
    if (!fs.existsSync(p.node)) problems.push(`node binary not found: ${p.node} (re-run tomnjerry setup)`);
    if (!fs.existsSync(p.bin)) problems.push(`tomnjerry not found at ${p.bin} (re-run tomnjerry setup)`);
  }
  return [...new Set(problems)];
}

function jsonHookHarness({ id, label, dirName, binName, configFile, projectConfigFile, skillsDir, projectSkillsDir, build, trust, extraStatus }) {
  const files = ({ home, root, projectHooks }) => projectHooks
    ? { config: projectConfigFile(root), skills: projectSkillsDir(root) }
    : { config: configFile(home), skills: skillsDir(home) };

  return {
    id, label,
    detect: ({ home, env }) => fs.existsSync(path.join(home, dirName)) || onPath(binName, env),
    install(opts) {
      const changed = [];
      const { config, skills } = files(opts);
      const cur = readJson(config);
      if (cur.error) return { changed, manual: cur.error };
      writeJson(config, mergeJsonHooks(cur.data, build(id, opts)), changed);
      installSkillCopies(skills, changed);
      return { changed, notes: trust ? [trust] : [] };
    },
    uninstall(opts) {
      const changed = [];
      for (const projectHooks of [false, true]) {
        if (projectHooks && !opts.root) continue;
        const { config, skills } = files({ ...opts, projectHooks });
        const cur = readJson(config);
        if (cur.exists && !cur.error) {
          const next = mergeJsonHooks(cur.data, null);
          if (JSON.stringify(next) !== JSON.stringify(cur.data)) writeJson(config, next, changed);
        }
        removeSkillCopies(skills, changed);
      }
      return { changed };
    },
    status(opts) {
      const results = [];
      for (const projectHooks of [false, true]) {
        if (projectHooks && !opts.root) continue;
        const { config } = files({ ...opts, projectHooks });
        const cur = readJson(config);
        if (!cur.exists) continue;
        if (cur.error) { results.push({ config, problems: [cur.error] }); continue; }
        const found = tnjCommandsByEvent(cur.data);
        if (!Object.keys(found).length) continue;
        const expected = Object.keys(build(id, opts));
        const problems = expected.filter(ev => !found[ev]).map(ev => `missing ${ev} hook`);
        problems.push(...commandProblems(Object.values(found).flat()));
        const commands = Object.fromEntries(Object.entries(found).map(([ev, cmds]) => [ev, cmds[0]]));
        results.push({ config, problems, commands, warnings: extraStatus ? extraStatus(opts, projectHooks) : [] });
      }
      return results;
    },
  };
}

const cmd = (event, harness, dialect) => ({ type: 'command', command: hookCommand(event, harness, dialect), timeout: 10 });

const claude = jsonHookHarness({
  id: 'claude', label: 'Claude Code', dirName: '.claude', binName: 'claude',
  configFile: home => path.join(home, '.claude', 'settings.json'),
  // settings.local.json: the command holds machine-specific absolute paths.
  projectConfigFile: root => path.join(root, '.claude', 'settings.local.json'),
  skillsDir: home => path.join(home, '.claude', 'skills'),
  projectSkillsDir: root => path.join(root, '.claude', 'skills'),
  build: h => ({
    SessionStart: [{ matcher: 'startup|resume|clear|compact', hooks: [cmd('sessionStart', h)] }],
    UserPromptSubmit: [{ hooks: [cmd('prompt', h)] }],
    PreToolUse: [{ matcher: 'Bash', hooks: [cmd('toolBefore', h)] }],
    PostToolUse: [{ matcher: 'Bash|Write|Edit|MultiEdit|NotebookEdit', hooks: [cmd('toolAfter', h)] }],
    PostToolUseFailure: [{ matcher: 'Bash|Write|Edit|MultiEdit|NotebookEdit', hooks: [cmd('toolAfter', h)] }],
    Stop: [{ hooks: [cmd('stop', h)] }],
  }),
});

const codex = jsonHookHarness({
  id: 'codex', label: 'Codex CLI', dirName: '.codex', binName: 'codex',
  configFile: home => path.join(home, '.codex', 'hooks.json'),
  projectConfigFile: root => path.join(root, '.codex', 'hooks.json'),
  skillsDir: home => path.join(home, '.agents', 'skills'),
  projectSkillsDir: root => path.join(root, '.agents', 'skills'),
  build: h => ({
    SessionStart: [{ hooks: [cmd('sessionStart', h)] }],
    UserPromptSubmit: [{ hooks: [cmd('prompt', h)] }],
    PreToolUse: [{ matcher: 'Bash', hooks: [cmd('toolBefore', h)] }],
    PostToolUse: [{ matcher: 'Bash|apply_patch|Edit|Write', hooks: [cmd('toolAfter', h)] }],
    Stop: [{ hooks: [cmd('stop', h)] }],
  }),
  trust: 'Codex: new hooks stay inactive until trusted. Open Codex, run /hooks, and trust the Tom n Jerry hooks.',
  extraStatus: ({ home, root }, projectHooks) => {
    const toml = readText(projectHooks ? path.join(root, '.codex', 'config.toml') : path.join(home, '.codex', 'config.toml')) || '';
    const problems = [];
    if (/^\s*\[hooks\]\s*$/m.test(toml)) problems.push('config.toml also has a [hooks] table in this layer; Codex warns when both exist');
    if (!/trusted_hash/.test(toml)) problems.push('hooks may not be trusted yet: open Codex and run /hooks');
    return problems;
  },
});

// ─── Hermes: YAML block in ~/.hermes/config.yaml ─────────────────────────────

const HERMES_BEGIN = '# >>> tomnjerry hooks >>>';
const HERMES_END = '# <<< tomnjerry hooks <<<';

function yamlQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function hermesBlock() {
  const entry = (event, matcher) => [
    `    - command: ${yamlQuote(hookCommand(event, 'hermes'))}`,
    ...(matcher ? [`      matcher: ${yamlQuote(matcher)}`] : []),
    '      timeout: 10',
  ];
  return [
    HERMES_BEGIN,
    'hooks:',
    '  on_session_start:', ...entry('sessionStart'),
    '  pre_llm_call:', ...entry('prompt'),
    '  pre_tool_call:', ...entry('toolBefore', 'terminal'),
    '  post_tool_call:', ...entry('toolAfter', 'terminal|write_file|patch'),
    '  pre_verify:', ...entry('stop'),
    HERMES_END,
  ].join('\n');
}

function stripHermesBlock(text) {
  const start = text.indexOf(HERMES_BEGIN);
  if (start < 0) return text;
  const endMarker = text.indexOf(HERMES_END, start);
  const end = endMarker < 0 ? text.length : endMarker + HERMES_END.length;
  const before = text.slice(0, start).replace(/\n+$/, '');
  const after = text.slice(end).replace(/^\n+/, '');
  return before && after ? `${before}\n${after}` : before ? `${before}\n` : after;
}

const hermes = {
  id: 'hermes', label: 'Hermes Agent',
  detect: ({ home, env }) => fs.existsSync(path.join(home, '.hermes')) || onPath('hermes', env),
  configFile: home => path.join(home, '.hermes', 'config.yaml'),
  install({ home }) {
    const changed = [];
    const file = this.configFile(home);
    const current = readText(file) || '';
    const withoutOurs = stripHermesBlock(current);
    const block = hermesBlock();
    if (/^hooks\s*:/m.test(withoutOurs)) {
      return {
        changed,
        manual: `${file} already has a top-level "hooks:" key, so it was left untouched. Merge these entries into it by hand:\n\n${block.split('\n').slice(2, -1).join('\n')}`,
      };
    }
    const sep = withoutOurs && !withoutOurs.endsWith('\n') ? '\n' : '';
    writeWithBackup(file, `${withoutOurs}${sep}${withoutOurs ? '\n' : ''}${block}\n`, changed);
    installSkillCopies(path.join(home, '.hermes', 'skills'), changed);
    return {
      changed,
      notes: ['Hermes: shell hooks ask for consent on first use. Approve them when Hermes prompts (or set hooks_auto_accept: true in config.yaml).'],
    };
  },
  uninstall({ home }) {
    const changed = [];
    const file = this.configFile(home);
    const current = readText(file);
    if (current != null && current.includes(HERMES_BEGIN)) writeWithBackup(file, stripHermesBlock(current), changed);
    removeSkillCopies(path.join(home, '.hermes', 'skills'), changed);
    return { changed };
  },
  status({ home }) {
    const file = this.configFile(home);
    const text = readText(file);
    if (!text || !text.includes(HERMES_BEGIN)) return [];
    const events = ['on_session_start', 'pre_llm_call', 'pre_tool_call', 'post_tool_call', 'pre_verify'];
    const block = text.slice(text.indexOf(HERMES_BEGIN), text.indexOf(HERMES_END) + 1 || undefined);
    const commands = {};
    for (const m of block.matchAll(/^  (\w+):\n    - command: '((?:[^']|'')*)'/gm)) commands[m[1]] = m[2].replace(/''/g, "'");
    const problems = events.filter(e => !commands[e]).map(e => `missing ${e} hook`);
    problems.push(...commandProblems(Object.values(commands)));
    return [{ config: file, problems, commands, warnings: [] }];
  },
};

// ─── In-process plugins: a managed shim file that re-exports our adapter ────

const SHIM_MARKER = '// Managed by `tomnjerry setup`. Remove with: tomnjerry remove';
const ADAPTERS_DIR = path.join(__dirname, '..', 'adapters');

function shimTarget(text) {
  const m = /from "(file:[^"]+)"/.exec(text || '');
  return m ? m[1] : null;
}

// Imports the real adapter in a child process and drives one fake turn.
function smokeModule(script) {
  const { spawnSync } = require('child_process');
  const os = require('os');
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tnj-doctor-')));
  try {
    fs.mkdirSync(path.join(root, '.git'));
    fs.cpSync(path.join(__dirname, '..', 'tnj'), path.join(root, '.tnj'), { recursive: true });
    const res = spawnSync(process.execPath, ['--input-type=module', '-e', script(root)], { encoding: 'utf8', timeout: 10000 });
    if (res.status !== 0) return `adapter failed to load: ${(res.stderr || '').trim().split('\n')[0]}`;
    return /Tom n Jerry/.test(res.stdout) ? '' : 'adapter loaded but produced no Tom n Jerry context';
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function shimHarness({ id, label, detect, shimFile, projectShimFile, exportLine, skillsDir, notes, projectNotes, cleanup, smokeScript }) {
  const fileFor = ({ home, root, projectHooks }) => (projectHooks ? projectShimFile(root) : shimFile(home));
  return {
    id, label, detect,
    install(opts) {
      const changed = [];
      const target = pathToFileURL(path.join(ADAPTERS_DIR, `${id}.mjs`)).href;
      writeWithBackup(fileFor(opts), `${SHIM_MARKER} --harness ${id}\n${exportLine(target)}\n`, changed);
      if (skillsDir) installSkillCopies(skillsDir(opts), changed);
      const out = [...(notes || []), ...(opts.projectHooks && projectNotes ? projectNotes : [])];
      if (cleanup) out.push(...cleanup(opts, changed));
      return { changed, notes: out };
    },
    uninstall(opts) {
      const changed = [];
      for (const projectHooks of [false, true]) {
        if (projectHooks && !opts.root) continue;
        const file = fileFor({ ...opts, projectHooks });
        if ((readText(file) || '').startsWith(SHIM_MARKER)) {
          fs.unlinkSync(file);
          changed.push(file);
        }
      }
      if (skillsDir) removeSkillCopies(skillsDir(opts), changed);
      return { changed };
    },
    status(opts) {
      const results = [];
      for (const projectHooks of [false, true]) {
        if (projectHooks && !opts.root) continue;
        const file = fileFor({ ...opts, projectHooks });
        const text = readText(file);
        if (!text || !text.startsWith(SHIM_MARKER)) continue;
        const target = shimTarget(text);
        const problems = [];
        if (!target || !fs.existsSync(fileURLToPath(target))) problems.push(`adapter not found at ${target} (re-run tomnjerry setup)`);
        results.push({ config: file, problems, warnings: [], smoke: () => smokeModule(root => smokeScript(target, root)) });
      }
      return results;
    },
  };
}

const opencode = shimHarness({
  id: 'opencode', label: 'opencode',
  detect: ({ home, env }) => fs.existsSync(path.join(home, '.config', 'opencode')) || onPath('opencode', env),
  shimFile: home => path.join(home, '.config', 'opencode', 'plugins', 'tomnjerry.js'),
  projectShimFile: root => path.join(root, '.opencode', 'plugins', 'tomnjerry.js'),
  exportLine: target => `export { TomNJerry } from ${JSON.stringify(target)};`,
  notes: ['opencode: restart opencode to load the Tom n Jerry plugin.'],
  // The plugin supersedes the legacy AGENTS.md protocol block; running both
  // would inject the loop twice.
  cleanup: ({ home }, changed) => {
    const file = path.join(home, '.config', 'opencode', 'AGENTS.md');
    const text = readText(file);
    const start = text ? text.indexOf('<!-- tnj-global-begin -->') : -1;
    const endTag = '<!-- tnj-global-end -->';
    if (start < 0 || text.indexOf(endTag) < 0) return [];
    const next = (text.slice(0, start) + text.slice(text.indexOf(endTag) + endTag.length)).replace(/\n{3,}/g, '\n\n');
    writeWithBackup(file, next, changed);
    return ['opencode: removed the legacy TNJ block from ~/.config/opencode/AGENTS.md (the plugin replaces it; a backup was kept).'];
  },
  smokeScript: (target, root) => `
    const { TomNJerry } = await import(${JSON.stringify(target)});
    const h = await TomNJerry({ client: {}, directory: ${JSON.stringify(root)} });
    await h['chat.message']({ sessionID: 'doctor' }, { parts: [{ type: 'text', text: 'add a dependency' }] });
    const out = { system: [] };
    await h['experimental.chat.system.transform']({ sessionID: 'doctor' }, out);
    process.stdout.write(out.system.join('\\n'));`,
});

const pi = shimHarness({
  id: 'pi', label: 'Pi',
  detect: ({ home, env }) => fs.existsSync(path.join(home, '.pi')) || onPath('pi', env),
  shimFile: home => path.join(home, '.pi', 'agent', 'extensions', 'tomnjerry.js'),
  projectShimFile: root => path.join(root, '.pi', 'extensions', 'tomnjerry.js'),
  exportLine: target => `export { default } from ${JSON.stringify(target)};`,
  skillsDir: ({ home, root, projectHooks }) => (projectHooks ? path.join(root, '.agents', 'skills') : path.join(home, '.agents', 'skills')),
  notes: ['Pi: restart pi (or /reload) to load the Tom n Jerry extension.'],
  projectNotes: ['Pi: project extensions load only after you trust the project in pi.'],
  smokeScript: (target, root) => `
    const { default: ext } = await import(${JSON.stringify(target)});
    const handlers = {};
    ext({ on: (name, fn) => { handlers[name] = fn; } });
    const event = { prompt: 'add a dependency', systemPrompt: '', systemPromptOptions: { sections: {} } };
    await handlers.before_agent_start(event, { cwd: ${JSON.stringify(root)}, sessionManager: { getSessionId: () => 'doctor' } });
    process.stdout.write(Object.values(event.systemPromptOptions.sections).join('\\n'));`,
});

const HARNESSES = [claude, codex, hermes, opencode, pi];

function byId(id) {
  return HARNESSES.find(h => h.id === id);
}

module.exports = { HARNESSES, byId, mergeJsonHooks, tnjCommandsByEvent, stripHermesBlock, hermesBlock, jsonHookHarness, commandProblems };
