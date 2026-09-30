'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULTS = Object.freeze({
  mode: 'advise',
  receipts: { gate: true },
  teacher: { nudge: true },
  jerry: { nativeReplacements: true },
});

const MODES = new Set(['advise', 'enforce', 'off']);

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function merge(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object'
      ? { ...base[k], ...v }
      : v;
  }
  return out;
}

function loadConfig(root, home = os.homedir()) {
  let cfg = merge(DEFAULTS, readJson(path.join(home, '.tnj', 'config.json')));
  cfg = merge(cfg, readJson(path.join(root, '.tnj', 'config.json')));
  if (!MODES.has(cfg.mode)) cfg.mode = DEFAULTS.mode;
  return cfg;
}

module.exports = { loadConfig, DEFAULTS };
