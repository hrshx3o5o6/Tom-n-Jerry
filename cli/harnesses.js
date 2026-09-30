'use strict';

const fs = require('fs');
const path = require('path');
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

const HARNESSES = [claude, codex, hermes];

function byId(id) {
  return HARNESSES.find(h => h.id === id);
}

module.exports = { HARNESSES, byId, mergeJsonHooks, tnjCommandsByEvent, stripHermesBlock, hermesBlock, jsonHookHarness, commandProblems };
