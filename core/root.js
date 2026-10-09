'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PROJECT_DIR_VARS = ['CLAUDE_PROJECT_DIR', 'GEMINI_PROJECT_DIR'];
const ROOT_MARKERS = ['.tnj', '.git', 'package.json'];

// The home directory and everything above it is never a project root: a stray
// ~/package.json or ~/.git must not turn all of ~ into one project.
function walkUp(start, marker, home) {
  let dir = path.resolve(start);
  for (;;) {
    if (dir === home || home.startsWith(dir + path.sep) || dir === path.parse(dir).root) return null;
    if (fs.existsSync(path.join(dir, marker))) return dir;
    dir = path.dirname(dir);
  }
}

function findRoot(cwd, env = process.env, home = os.homedir()) {
  for (const name of PROJECT_DIR_VARS) {
    const value = env[name];
    if (value && fs.existsSync(value)) return path.resolve(value);
  }
  const start = cwd || process.cwd();
  const homeDir = path.resolve(home);
  for (const marker of ROOT_MARKERS) {
    const found = walkUp(start, marker, homeDir);
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
