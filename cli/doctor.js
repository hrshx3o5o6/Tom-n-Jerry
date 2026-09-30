'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { HARNESSES } = require('./harnesses');

// Native event names for the "prompt" hook of each harness, and a payload the
// harness would send for it.
const PROMPT_PAYLOAD = {
  UserPromptSubmit: cwd => ({ session_id: 'tnj-doctor', cwd, hook_event_name: 'UserPromptSubmit', prompt: 'add a dependency' }),
  pre_llm_call: cwd => ({ session_id: 'tnj-doctor', cwd, hook_event_name: 'pre_llm_call', extra: { user_message: 'add a dependency' } }),
  BeforeAgent: cwd => ({ session_id: 'tnj-doctor', cwd, hook_event_name: 'BeforeAgent', prompt: 'add a dependency' }),
  PreInvocation: cwd => ({ conversationId: 'tnj-doctor', workspacePaths: [cwd] }),
};

function smokeProject() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tnj-doctor-')));
  fs.mkdirSync(path.join(root, '.git'));
  fs.writeFileSync(path.join(root, 'package.json'), '{"dependencies":{"express":"^4"}}');
  fs.cpSync(path.join(__dirname, '..', 'tnj'), path.join(root, '.tnj'), { recursive: true });
  return root;
}

// Runs the exact configured command, the way the harness would.
function smoke(commands) {
  const event = Object.keys(PROMPT_PAYLOAD).find(ev => commands[ev]);
  if (!event) return null;
  const root = smokeProject();
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  delete env.GEMINI_PROJECT_DIR;
  try {
    const res = spawnSync(commands[event], {
      shell: true, env, input: JSON.stringify(PROMPT_PAYLOAD[event](root)), encoding: 'utf8', timeout: 10000,
    });
    if (res.status !== 0) return `hook command exited ${res.status}: ${(res.stderr || '').trim().slice(0, 200)}`;
    if (!/Tom n Jerry/.test(res.stdout)) return 'hook command ran but produced no Tom n Jerry context';
    return '';
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function checkHooks({ home = os.homedir(), root, log = console.log } = {}) {
  let ok = true;
  let any = false;
  log('\nHarness hooks:');
  for (const h of HARNESSES) {
    const results = h.status({ home, root });
    if (!results.length) {
      log(`  · ${h.label}: not configured`);
      continue;
    }
    for (const r of results) {
      any = true;
      const problems = [...r.problems];
      if (!problems.length) {
        const err = r.smoke ? r.smoke() : r.commands ? smoke(r.commands) : '';
        if (err) problems.push(err);
      }
      if (problems.length) {
        ok = false;
        log(`  ✖ ${h.label} (${r.config})`);
        for (const p of problems) log(`      ${p}`);
      } else {
        log(`  ✔ ${h.label} (${r.config})`);
      }
      for (const w of r.warnings || []) log(`      ⚠ ${w}`);
    }
  }
  if (!any) log('  ℹ No hooks installed. Run: tomnjerry setup');
  return ok;
}

module.exports = { checkHooks, smoke };
