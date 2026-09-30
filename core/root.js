'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_DIR_VARS = ['CLAUDE_PROJECT_DIR', 'GEMINI_PROJECT_DIR'];
const ROOT_MARKERS = ['.tnj', '.git', 'package.json'];

function walkUp(start, marker) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, marker))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function findRoot(cwd, env = process.env) {
  for (const name of PROJECT_DIR_VARS) {
    const value = env[name];
    if (value && fs.existsSync(value)) return path.resolve(value);
  }
  const start = cwd || process.cwd();
  for (const marker of ROOT_MARKERS) {
    const found = walkUp(start, marker);
    if (found) return found;
  }
  return path.resolve(start);
}

function sanitizeId(id) {
  const s = String(id);
  if (/^[A-Za-z0-9_.-]{1,100}$/.test(s) && !/^\.+$/.test(s)) return s;
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);
}

function currentSessionFile(tnjDir) {
  return path.join(tnjDir, 'current-session');
}

function rotateSession(tnjDir) {
  const id = crypto.randomBytes(8).toString('hex');
  fs.writeFileSync(currentSessionFile(tnjDir), id + '\n');
  return id;
}

function resolveSessionId(harnessId, tnjDir) {
  if (harnessId) return sanitizeId(harnessId);
  try {
    const stored = fs.readFileSync(currentSessionFile(tnjDir), 'utf8').trim();
    if (stored) return sanitizeId(stored);
  } catch {}
  return 'default';
}

module.exports = { findRoot, resolveSessionId, rotateSession, sanitizeId };
