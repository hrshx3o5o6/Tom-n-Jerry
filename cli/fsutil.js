'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_ROOT = path.join(__dirname, '..');
const BIN = path.join(PACKAGE_ROOT, 'bin', 'tomnjerry.js');

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function readJson(file) {
  const text = readText(file);
  if (text == null) return { exists: false, data: {} };
  if (!text.trim()) return { exists: true, data: {} };
  try {
    return { exists: true, data: JSON.parse(text) };
  } catch (err) {
    return { exists: true, error: `${file} is not valid JSON (${err.message})` };
  }
}

// Writes only when content changes; backs up the previous version first.
function writeWithBackup(file, content, changed) {
  const before = readText(file);
  if (before === content) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (before != null) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(`${file}.tnj-backup-${stamp}`, before);
  }
  fs.writeFileSync(file, content);
  if (changed) changed.push(file);
  return true;
}

function writeJson(file, data, changed) {
  return writeWithBackup(file, JSON.stringify(data, null, 2) + '\n', changed);
}

function quote(p) {
  return `"${String(p).replace(/"/g, '\\"')}"`;
}

function binPath() {
  try { return fs.realpathSync(BIN); } catch { return BIN; }
}

function hookCommand(event, harness, dialect = 'claude', { node = process.execPath, bin = binPath() } = {}) {
  return `${quote(node)} ${quote(bin)} hook ${event} --dialect ${dialect} --harness ${harness}`;
}

const TNJ_COMMAND_RE = /\bhook (sessionStart|prompt|toolBefore|toolAfter|stop)\b.*--harness\b/;

function isTnjCommand(cmd) {
  return typeof cmd === 'string' && TNJ_COMMAND_RE.test(cmd);
}

// Pulls the node and bin paths back out of a generated command.
function commandPaths(cmd) {
  const m = /^"([^"]+)" "([^"]+)" hook /.exec(cmd || '');
  return m ? { node: m[1], bin: m[2] } : null;
}

function onPath(name, env = process.env) {
  const exts = process.platform === 'win32' ? ['.cmd', '.exe', ''] : [''];
  for (const dir of String(env.PATH || '').split(path.delimiter)) {
    for (const ext of exts) {
      if (dir && fs.existsSync(path.join(dir, name + ext))) return true;
    }
  }
  return false;
}

module.exports = {
  PACKAGE_ROOT, readText, readJson, writeWithBackup, writeJson, hookCommand,
  isTnjCommand, commandPaths, onPath, binPath, quote,
};
