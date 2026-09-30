'use strict';

const fs = require('fs');
const path = require('path');

const SUMMARY = [
  '[Tom n Jerry] The TNJ loop is active and enforced by hooks. Every task:',
  '- Tom: propose one concrete action and name the command that will prove it works, before editing.',
  '- Jerry: when the action adds a dependency, route, schema, auth/crypto code, or a new file, first check what already exists: git history, the codebase (rg), package manifests and lockfiles, the stdlib, native platform features, framework conventions. Prefer reuse. Build the minimum.',
  '- Receipt: after changing code, run the verifying command and show its real output. "It built" is not proof.',
  '- Teacher: if you found a reusable shortcut, record it in .tnj/learnings/<slug>.md and register it in .tnj/index.json.',
  'Hooks check installs against your manifests and track verification automatically. Skills: .tnj/skills/<id>/SKILL.md, catalog: .tnj/index.json.',
].join('\n');

const NO_TNJ_NOTICE = '[Tom n Jerry] Installed, but this repo has no .tnj/ directory, so Jerry and receipts are off here. To enable them, run: tomnjerry setup --project';

function readIndex(tnjDir) {
  try { return JSON.parse(fs.readFileSync(path.join(tnjDir, 'index.json'), 'utf8')); } catch { return null; }
}

function loopState(tnjDir) {
  try {
    const raw = fs.readFileSync(path.join(tnjDir, 'loop-state.json'), 'utf8').trim();
    return raw.length > 600 ? raw.slice(0, 600) + '…' : raw;
  } catch {
    return null;
  }
}

function matchSkills(tnjDir, prompt, limit = 3) {
  const index = readIndex(tnjDir);
  if (!index || !Array.isArray(index.skills) || !prompt) return [];
  const text = ` ${String(prompt).toLowerCase()} `;
  const scored = [];
  for (const s of index.skills) {
    if (!Array.isArray(s.keywords) || s.trigger === 'every-turn') continue;
    let score = 0;
    for (const k of s.keywords) {
      const kw = String(k).toLowerCase();
      if (kw.length > 2 && new RegExp(`[^a-z0-9]${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(text)) score++;
    }
    if (score > 0) scored.push({ s, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ s }) => s);
}

function turnContext(tnjDir, prompt, { full = false, findings = [] } = {}) {
  const parts = [];
  if (full) parts.push(SUMMARY);
  else parts.push('[Tom n Jerry] Loop active: Tom → Jerry → Receipt → Teacher.');
  const state = loopState(tnjDir);
  if (state) parts.push(`Loop state (.tnj/loop-state.json): ${state}`);
  const skills = matchSkills(tnjDir, prompt);
  if (skills.length) {
    parts.push('Relevant TNJ skills for this request (read before implementing):');
    for (const s of skills) parts.push(`- ${s.id}: .tnj/${s.path} (${s.trigger})`);
  }
  if (findings.length) {
    parts.push('Jerry findings since your last message:');
    for (const f of findings) parts.push(`- ${f.msg}`);
  }
  return parts.join('\n');
}

module.exports = { SUMMARY, NO_TNJ_NOTICE, turnContext, matchSkills };
