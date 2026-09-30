'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..');

function tmpdir(prefix = 'tnj-test-') {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function write(root, rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  return file;
}

// A project with .tnj/ scaffolded from the package and an Express app that
// already depends on express-rate-limit.
function makeProject({ tnj = true, config, files = {} } = {}) {
  const root = tmpdir();
  fs.mkdirSync(path.join(root, '.git'));
  write(root, 'package.json', {
    name: 'fixture',
    dependencies: { express: '^4.19.0', 'express-rate-limit': '^7.1.0' },
    devDependencies: { jest: '^29.0.0' },
  });
  write(root, 'package-lock.json', { packages: { 'node_modules/express': {}, 'node_modules/debug': {} } });
  write(root, 'src/index.js', "const express = require('express');\n");
  if (tnj) {
    fs.cpSync(path.join(REPO, 'tnj'), path.join(root, '.tnj'), { recursive: true });
    if (config) write(root, '.tnj/config.json', config);
  }
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  return root;
}

function readLog(root, sessionId) {
  try {
    return fs.readFileSync(path.join(root, '.tnj', 'sessions', `${sessionId}.jsonl`), 'utf8')
      .trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch {
    return [];
  }
}

const NO_ENV = {};

module.exports = { REPO, tmpdir, write, makeProject, readLog, NO_ENV };
