#!/usr/bin/env node
// Tom n Jerry — Stack Detection Script
// Reads CWD, checks for tech stack indicators, returns active context packs.
//
// Usage:
//   node bin/detect-stack.js          → prints active pack names
//   node bin/detect-stack.js --paths  → prints pack file paths
//   node bin/detect-stack.js --inject → prints concatenated rules

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'templates', 'rules', 'index.json');
const RULES_DIR = path.join(__dirname, '..', 'templates', 'rules');

function getMode() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  const envMode = process.env.TNJ_MODE || '';
  const valid = Object.keys(index.modes);
  const mode = valid.includes(envMode) ? envMode : index.defaultMode;
  // If ponytail package detected, switch automatically (unless TNJ_MODE explicitly set)
  if (!process.env.TNJ_MODE) {
    try {
      require('@dietrichgebert/ponytail/package.json');
      return 'ponytail';
    } catch {}
  }
  return mode;
}

function detect() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  const cwd = process.cwd();
  const active = [];

  for (const [name, pack] of Object.entries(index.packs)) {
    if (pack.always) {
      active.push(name);
      continue;
    }
    for (const rule of (pack.detect || [])) {
      if (rule.file) {
        const targetPath = path.join(cwd, rule.file);
        try {
          const stat = fs.lstatSync(targetPath);
          if (stat.isFile() || stat.isDirectory()) {
            active.push(name);
            break;
          }
        } catch { /* not found */ }
      }
      if (rule.regex && rule.in) {
        if (rule.in === 'dir') {
          // Check if any file in CWD matches regex
          try {
            const entries = fs.readdirSync(cwd);
            if (entries.some(e => new RegExp(rule.regex).test(e))) {
              active.push(name);
              break;
            }
          } catch { /* can't read dir */ }
        } else {
          // Check specific file content for regex
          const targetFile = path.join(cwd, rule.in);
          try {
            const content = fs.readFileSync(targetFile, 'utf-8');
            if (new RegExp(rule.regex).test(content)) {
              active.push(name);
              break;
            }
          } catch { /* file not found or unreadable */ }
        }
      }
    }
  }

  return [...new Set(active)]; // deduplicate
}

function main() {
  const active = detect();
  const flag = process.argv[2];
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  const mode = getMode();

  if (flag === '--mode') {
    console.log(mode);
  } else if (flag === '--paths') {
    const paths = active.map(name => {
      // Use mode-specific core file
      if (name === 'core' && mode !== index.defaultMode) {
        const modeCore = index.modes[mode]?.core;
        if (modeCore) return path.join(__dirname, '..', modeCore);
      }
      const file = index.packs[name]?.file;
      return file ? path.join(__dirname, '..', file) : null;
    }).filter(Boolean);
    console.log(paths.join('\n'));
  } else if (flag === '--inject') {
    for (const name of active) {
      let file;
      if (name === 'core' && mode !== index.defaultMode) {
        file = index.modes[mode]?.core;
      } else {
        file = index.packs[name]?.file;
      }
      if (file) {
        const fullPath = path.join(__dirname, '..', file);
        try {
          console.log(fs.readFileSync(fullPath, 'utf-8'));
          console.log('');
        } catch { /* skip unreadable */ }
      }
    }
  } else {
    console.log(active.join('\n'));
  }
}

if (require.main === module) main();
module.exports = { detect, getMode };
