'use strict';

const fs = require('fs');
const path = require('path');
const { PACKAGE_ROOT, readJson, writeJson, writeWithBackup, readText } = require('./fsutil');

const PKG_TNJ = path.join(PACKAGE_ROOT, 'tnj');
const GITIGNORE_LINES = ['sessions/', 'receipts.jsonl', 'errors.log', 'current-session'];

function packageSkillIds() {
  return fs.readdirSync(path.join(PKG_TNJ, 'skills'), { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(PKG_TNJ, 'skills', d.name, 'SKILL.md')))
    .map(d => d.name)
    .sort();
}

function packageIndex() {
  return JSON.parse(fs.readFileSync(path.join(PKG_TNJ, 'index.json'), 'utf8'));
}

// Keeps the user's learnings entries; refreshes package-owned skill entries.
function mergeIndex(existing, pkg) {
  const out = { ...existing, version: pkg.version, description: pkg.description };
  const skills = Array.isArray(existing.skills) ? existing.skills.map(s => ({ ...s })) : [];
  for (const s of skills) delete s.usageCount;
  for (const ps of pkg.skills) {
    const i = skills.findIndex(s => s.id === ps.id);
    if (i >= 0) skills[i] = { ...skills[i], ...ps };
    else skills.push({ ...ps });
  }
  out.skills = skills;
  return out;
}

function ensureGitignore(tnjDir, changed) {
  const file = path.join(tnjDir, '.gitignore');
  const current = readText(file) || '';
  const have = new Set(current.split('\n').map(l => l.trim()));
  const missing = GITIGNORE_LINES.filter(l => !have.has(l));
  if (missing.length === 0) return;
  const prefix = current && !current.endsWith('\n') ? '\n' : '';
  const header = current ? '' : '# Tom n Jerry runtime files (per machine)\n';
  writeWithBackup(file, current + prefix + header + missing.join('\n') + '\n', changed);
}

function scaffoldProject(root, { mode } = {}) {
  const changed = [];
  const tnjDir = path.join(root, '.tnj');
  fs.mkdirSync(path.join(tnjDir, 'learnings'), { recursive: true });
  const keep = path.join(tnjDir, 'learnings', '.gitkeep');
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');

  for (const id of packageSkillIds()) {
    const src = path.join(PKG_TNJ, 'skills', id, 'SKILL.md');
    const dest = path.join(tnjDir, 'skills', id, 'SKILL.md');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (readText(dest) !== readText(src)) {
      fs.copyFileSync(src, dest);
      changed.push(dest);
    }
    const legacy = path.join(tnjDir, 'skills', `${id}.md`);
    if (fs.existsSync(legacy)) fs.unlinkSync(legacy);
  }

  const indexFile = path.join(tnjDir, 'index.json');
  const existing = readJson(indexFile);
  const merged = existing.exists && !existing.error ? mergeIndex(existing.data, packageIndex()) : packageIndex();
  writeJson(indexFile, merged, changed);

  ensureGitignore(tnjDir, changed);

  const configFile = path.join(tnjDir, 'config.json');
  if (!fs.existsSync(configFile)) {
    writeJson(configFile, { mode: mode || 'advise', receipts: { gate: true }, teacher: { nudge: true }, jerry: { nativeReplacements: true } }, changed);
  } else if (mode) {
    const cfg = readJson(configFile);
    if (!cfg.error && cfg.data.mode !== mode) writeJson(configFile, { ...cfg.data, mode }, changed);
  }
  return changed;
}

// Harness-native skill copies, renamed tnj-<id> so they never clash with the
// user's own skills and can be removed exactly.
function installSkillCopies(skillsDir, changed) {
  for (const id of packageSkillIds()) {
    const src = readText(path.join(PKG_TNJ, 'skills', id, 'SKILL.md'));
    const renamed = src.replace(/^name: .*$/m, `name: tnj-${id}`);
    writeWithBackup(path.join(skillsDir, `tnj-${id}`, 'SKILL.md'), renamed, changed);
  }
}

function removeSkillCopies(skillsDir, changed) {
  let entries = [];
  try { entries = fs.readdirSync(skillsDir); } catch { return; }
  for (const name of entries) {
    if (!name.startsWith('tnj-')) continue;
    const dir = path.join(skillsDir, name);
    fs.rmSync(dir, { recursive: true, force: true });
    changed.push(dir);
  }
}

module.exports = { scaffoldProject, installSkillCopies, removeSkillCopies, packageSkillIds, mergeIndex, GITIGNORE_LINES };
