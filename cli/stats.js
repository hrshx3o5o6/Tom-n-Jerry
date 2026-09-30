'use strict';

const fs = require('fs');
const path = require('path');
const { findRoot } = require('../core/root');
const session = require('../core/session');

function readJsonl(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const out = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
}

function collect(root) {
  const tnjDir = path.join(root, '.tnj');
  const dir = session.sessionsDir(tnjDir);
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')); } catch {}
  const events = files.flatMap(f => readJsonl(path.join(dir, f)));
  const receipts = readJsonl(path.join(tnjDir, 'receipts.jsonl'));
  const jerry = events.filter(e => e.e === 'jerry');
  const shells = events.filter(e => e.e === 'shell');
  const nudges = events.filter(e => e.e === 'nudge');
  let learningFiles = 0;
  try { learningFiles = fs.readdirSync(path.join(tnjDir, 'learnings')).filter(f => f.endsWith('.md')).length; } catch {}
  const times = events.map(e => e.t).filter(Number.isFinite);
  return {
    project: root,
    since: times.length ? new Date(Math.min(...times)).toISOString() : null,
    sessions: files.length,
    turns: events.filter(e => e.e === 'prompt').length,
    jerry: {
      findings: jerry.length,
      duplicateInstallsCaught: jerry.filter(e => e.kind === 'present').length,
      nativeAlternativesSuggested: jerry.filter(e => e.kind === 'native').length,
      installsBlocked: jerry.filter(e => e.blocked).length,
      packages: [...new Set(jerry.map(e => e.pkg))].sort(),
    },
    receipts: {
      commandsLogged: receipts.length,
      verificationRuns: shells.filter(e => e.verify).length,
      failedCommands: receipts.filter(r => Number.isInteger(r.exit) && r.exit !== 0).length,
      codeEdits: events.filter(e => e.e === 'edit').length,
      nudges: nudges.filter(n => n.kind === 'receipt').length,
    },
    teacher: {
      nudges: nudges.filter(n => n.kind === 'teacher').length,
      learningsWritten: events.filter(e => e.e === 'learning').length,
      learningFiles,
    },
  };
}

function render(s) {
  const row = (label, value) => `  ${label.padEnd(34)}${value}`;
  return [
    `🐭 Tom n Jerry stats — ${s.project}`,
    s.since ? `   since ${s.since.slice(0, 10)} (session logs keep 7 days)` : '   no sessions recorded yet',
    '',
    row('Sessions', s.sessions),
    row('Turns', s.turns),
    '',
    'Jerry',
    row('Duplicate installs caught', s.jerry.duplicateInstallsCaught),
    row('Native alternatives suggested', s.jerry.nativeAlternativesSuggested),
    row('Installs blocked (enforce mode)', s.jerry.installsBlocked),
    row('Packages', s.jerry.packages.join(', ') || '—'),
    '',
    'Receipts',
    row('Commands logged', s.receipts.commandsLogged),
    row('Verification runs', s.receipts.verificationRuns),
    row('Failed commands', s.receipts.failedCommands),
    row('Code edits', s.receipts.codeEdits),
    row('"Prove it" nudges', s.receipts.nudges),
    '',
    'Teacher',
    row('Nudges', s.teacher.nudges),
    row('Learnings written this week', s.teacher.learningsWritten),
    row('Learning files', s.teacher.learningFiles),
  ].join('\n');
}

function stats(argv, { cwd = process.cwd(), log = console.log } = {}) {
  const root = findRoot(cwd, {});
  if (!fs.existsSync(path.join(root, '.tnj'))) {
    log(`ℹ No .tnj/ in ${root}. Run: tomnjerry setup --project`);
    return 1;
  }
  const s = collect(root);
  log(argv.includes('--json') ? JSON.stringify(s, null, 2) : render(s));
  return 0;
}

module.exports = { stats, collect };
