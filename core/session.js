'use strict';

const fs = require('fs');
const path = require('path');

const MAX_LINE = 3800;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sessionsDir(tnjDir) {
  return path.join(tnjDir, 'sessions');
}

function logPath(tnjDir, sessionId) {
  return path.join(sessionsDir(tnjDir), `${sessionId}.jsonl`);
}

function clip(value, max) {
  return typeof value === 'string' && value.length > max ? value.slice(0, max) : value;
}

// One appendFileSync per event: a single O_APPEND write, so concurrent hook
// processes never interleave or lose lines.
function appendLine(file, obj) {
  let line = JSON.stringify(obj);
  if (line.length > MAX_LINE) {
    const trimmed = { ...obj };
    for (const k of Object.keys(trimmed)) trimmed[k] = clip(trimmed[k], 300);
    line = JSON.stringify(trimmed);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, line + '\n');
}

function append(tnjDir, sessionId, event) {
  appendLine(logPath(tnjDir, sessionId), { t: Date.now(), ...event });
}

function read(tnjDir, sessionId) {
  let text;
  try {
    text = fs.readFileSync(logPath(tnjDir, sessionId), 'utf8');
  } catch {
    return [];
  }
  const events = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    try { events.push(JSON.parse(line)); } catch {}
  }
  return events;
}

function lastIndex(events, pred, from = 0) {
  for (let i = events.length - 1; i >= from; i--) if (pred(events[i])) return i;
  return -1;
}

function derive(events) {
  const lastPrompt = lastIndex(events, e => e.e === 'prompt');
  const turnStart = lastPrompt + 1;
  const delivered = new Set(events.filter(e => e.e === 'delivered').flatMap(e => e.ids || []));
  const jerry = events.filter(e => e.e === 'jerry');
  return {
    turn: events.filter(e => e.e === 'prompt').length,
    continuesThisTurn: events.slice(turnStart).filter(e => e.e === 'nudge').length,
    teacherNudged: events.some(e => e.e === 'nudge' && e.kind === 'teacher'),
    lastEdit: lastIndex(events, e => e.e === 'edit'),
    lastVerify: lastIndex(events, e => e.e === 'shell' && e.verify),
    lastReceiptNudge: lastIndex(events, e => e.e === 'nudge' && e.kind === 'receipt'),
    editedThisTurn: lastIndex(events, e => e.e === 'edit', turnStart) >= 0,
    jerryCount: jerry.length,
    undelivered: jerry.filter(e => e.id && !e.delivered && !delivered.has(e.id)),
    learningsTouched: events.some(e => e.e === 'learning'),
  };
}

function cleanup(tnjDir, now = Date.now()) {
  const dir = sessionsDir(tnjDir);
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (!name.endsWith('.jsonl')) continue;
    const file = path.join(dir, name);
    try {
      if (now - fs.statSync(file).mtimeMs > TTL_MS) fs.unlinkSync(file);
    } catch {}
  }
}

module.exports = { append, appendLine, read, derive, cleanup, logPath, sessionsDir };
