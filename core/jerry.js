'use strict';

const fs = require('fs');
const path = require('path');

// Package managers: which argv prefixes add a dependency, and its ecosystem.
const INSTALLERS = [
  { eco: 'node', match: ['npm', ['install', 'i', 'add', 'in', 'isntall']] },
  { eco: 'node', match: ['pnpm', ['add', 'install', 'i']] },
  { eco: 'node', match: ['yarn', ['add']] },
  { eco: 'node', match: ['bun', ['add', 'install', 'i']] },
  { eco: 'python', match: ['pip', ['install']] },
  { eco: 'python', match: ['pip3', ['install']] },
  { eco: 'python', match: ['uv', ['add']] },
  { eco: 'python', match: ['poetry', ['add']] },
  { eco: 'rust', match: ['cargo', ['add']] },
  { eco: 'go', match: ['go', ['get']] },
  { eco: 'ruby', match: ['gem', ['install']] },
  { eco: 'ruby', match: ['bundle', ['add']] },
];

// Flags whose next token is a value, not a package.
const VALUE_FLAGS = new Set([
  '-r', '--requirement', '-c', '--constraint', '-e', '--editable', '-i', '--index-url',
  '--extra-index-url', '-t', '--target', '--registry', '--prefix', '-C', '--cwd',
  '--filter', '-F', '--workspace', '-w', '--features', '--version', '-v', '--group', '-G',
]);

const GLOBAL_FLAGS = new Set(['-g', '--global', '--user']);

const NATIVE = {
  node: {
    uuid: 'crypto.randomUUID() (built into Node 19+ and browsers)',
    'node-fetch': 'the global fetch() (Node 18+)',
    'cross-fetch': 'the global fetch() (Node 18+)',
    'lodash.clonedeep': 'structuredClone()',
    'left-pad': 'String.prototype.padStart()',
    rimraf: "fs.rmSync(p, { recursive: true, force: true })",
    mkdirp: 'fs.mkdirSync(p, { recursive: true })',
    dotenv: 'node --env-file=.env (Node 20.6+)',
    'body-parser': 'express.json() / express.urlencoded() (Express 4.16+)',
    flatpickr: '<input type="date">',
    'react-datepicker': '<input type="date">',
    'react-modal': 'the native <dialog> element',
    'object-assign': 'Object.assign()',
    'array-flatten': 'Array.prototype.flat()',
  },
  python: {
    pytz: 'zoneinfo (stdlib, Python 3.9+)',
    mock: 'unittest.mock (stdlib)',
    toml: 'tomllib for reading (stdlib, Python 3.11+)',
    simplejson: 'json (stdlib)',
    dataclasses: 'dataclasses (stdlib since Python 3.7)',
    pathlib2: 'pathlib (stdlib)',
  },
};

function splitSegments(cmd) {
  return String(cmd).split(/&&|\|\||;|\||\n/).map(s => s.trim()).filter(Boolean);
}

function tokenize(segment) {
  const tokens = segment.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return tokens.map(t => t.replace(/^["']|["']$/g, ''));
}

function stripPrefix(tokens) {
  let i = 0;
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || tokens[i] === 'sudo' || tokens[i] === 'env')) i++;
  let rest = tokens.slice(i);
  // python -m pip install / uv pip install
  if (/^python[0-9.]*$/.test(rest[0]) && rest[1] === '-m') rest = rest.slice(2);
  if (rest[0] === 'uv' && rest[1] === 'pip') rest = ['pip', ...rest.slice(2)];
  return rest;
}

function normalizeName(eco, raw) {
  let name = raw;
  if (eco === 'node') {
    if (/^(file:|link:|git\+|https?:|\.|\/)/.test(name)) return null;
    const at = name.startsWith('@') ? name.indexOf('@', 1) : name.indexOf('@');
    if (at > 0) name = name.slice(0, at);
    if (name.startsWith('npm:')) return null;
  } else if (eco === 'python') {
    if (/^(\.|\/|git\+|https?:)/.test(name) || name.endsWith('.whl')) return null;
    name = name.split(/[=<>!~\[;@ ]/)[0].toLowerCase().replace(/_/g, '-');
  } else if (eco === 'go') {
    name = name.split('@')[0];
  } else {
    name = name.split('@')[0];
  }
  return name || null;
}

function parseInstalls(cmd) {
  const out = [];
  for (const segment of splitSegments(cmd)) {
    const tokens = stripPrefix(tokenize(segment));
    const inst = INSTALLERS.find(({ match: [bin, verbs] }) => tokens[0] === bin && verbs.includes(tokens[1]));
    if (!inst) continue;
    const args = tokens.slice(2);
    if (args.some(a => GLOBAL_FLAGS.has(a))) continue;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (VALUE_FLAGS.has(a)) { i++; continue; }
      if (a.startsWith('-')) continue;
      const name = normalizeName(inst.eco, a);
      if (name) out.push({ eco: inst.eco, name, manager: tokens[0] });
    }
  }
  return out;
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function findLine(text, re) {
  const m = re.exec(text);
  return m ? lineOf(text, m.index) : null;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nodeDirs(root, cwd) {
  const dirs = [];
  let dir = path.resolve(cwd || root);
  const top = path.resolve(root);
  while (dir.startsWith(top)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) dirs.push(dir);
    if (dir === top) break;
    dir = path.dirname(dir);
  }
  if (!dirs.includes(top)) dirs.push(top);
  return dirs;
}

function rel(root, file) {
  return path.relative(root, file) || path.basename(file);
}

function checkNode(root, cwd, name) {
  const q = escapeRe(name);
  for (const dir of nodeDirs(root, cwd)) {
    const pkgFile = path.join(dir, 'package.json');
    const text = readText(pkgFile);
    if (!text) continue;
    let pkg;
    try { pkg = JSON.parse(text); } catch { continue; }
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      if (pkg[field] && Object.prototype.hasOwnProperty.call(pkg[field], name)) {
        const line = findLine(text, new RegExp(`"${q}"\\s*:`));
        return { direct: true, where: `${rel(root, pkgFile)}${line ? ':' + line : ''}` };
      }
    }
  }
  const locks = [
    ['package-lock.json', new RegExp(`"node_modules/${q}"`)],
    ['pnpm-lock.yaml', new RegExp(`(^|\\s|/)${q}@`, 'm')],
    ['yarn.lock', new RegExp(`^"?${q}@`, 'm')],
    ['bun.lock', new RegExp(`"${q}"`)],
  ];
  for (const [file, re] of locks) {
    const text = readText(path.join(root, file));
    if (text && re.test(text)) return { direct: false, where: file };
  }
  return null;
}

function checkPython(root, name) {
  const variants = new Set([name, name.replace(/-/g, '_')]);
  const alt = [...variants].map(escapeRe).join('|');
  const reqRe = new RegExp(`^\\s*(${alt})\\s*($|[=<>!~\\[;@ ])`, 'im');
  let files = [];
  try { files = fs.readdirSync(root).filter(f => /^requirements.*\.txt$/.test(f)); } catch {}
  for (const f of files) {
    const text = readText(path.join(root, f));
    const line = text && findLine(text, reqRe);
    if (line) return { direct: true, where: `${f}:${line}` };
  }
  const pyproject = readText(path.join(root, 'pyproject.toml'));
  if (pyproject) {
    const line = findLine(pyproject, new RegExp(`(^|["'\\s])(${alt})\\s*($|["'=<>!~\\[;,])`, 'im'));
    if (line) return { direct: true, where: `pyproject.toml:${line}` };
  }
  for (const lock of ['poetry.lock', 'uv.lock']) {
    const text = readText(path.join(root, lock));
    if (text && new RegExp(`name = "(${alt})"`, 'i').test(text)) return { direct: false, where: lock };
  }
  return null;
}

function checkSimple(root, file, re, lock, lockRe) {
  const text = readText(path.join(root, file));
  const line = text && findLine(text, re);
  if (line) return { direct: true, where: `${file}:${line}` };
  const lockText = lock && readText(path.join(root, lock));
  if (lockText && lockRe.test(lockText)) return { direct: false, where: lock };
  return null;
}

function checkPackage(root, cwd, { eco, name }) {
  const q = escapeRe(name);
  switch (eco) {
    case 'node': return checkNode(root, cwd, name);
    case 'python': return checkPython(root, name);
    case 'rust': return checkSimple(root, 'Cargo.toml', new RegExp(`^\\s*(${q}\\s*=|\\[(dev-)?dependencies\\.${q}\\])`, 'm'), 'Cargo.lock', new RegExp(`name = "${q}"`));
    case 'go': return checkSimple(root, 'go.mod', new RegExp(`(^|\\s)${q}\\s+v`, 'm'), 'go.sum', new RegExp(`^${q} `, 'm'));
    case 'ruby': return checkSimple(root, 'Gemfile', new RegExp(`^\\s*gem\\s+["']${q}["']`, 'm'), 'Gemfile.lock', new RegExp(`^\\s{4}${q} \\(`, 'm'));
    default: return null;
  }
}

// Returns findings for a shell command. Each finding: { pkg, eco, kind, where?, direct?, message }.
function inspect(root, cwd, cmd, cfg) {
  const findings = [];
  for (const inst of parseInstalls(cmd)) {
    const hit = checkPackage(root, cwd, inst);
    if (hit) {
      findings.push({
        pkg: inst.name, eco: inst.eco, kind: 'present', direct: hit.direct, where: hit.where,
        message: hit.direct
          ? `\`${inst.name}\` is already a dependency (${hit.where}). Use it instead of installing it again.`
          : `\`${inst.name}\` is already in ${hit.where} as a transitive dependency. Only add it directly if your code imports it.`,
      });
      continue;
    }
    const native = cfg.jerry.nativeReplacements && NATIVE[inst.eco] && NATIVE[inst.eco][inst.name];
    if (native) {
      findings.push({
        pkg: inst.name, eco: inst.eco, kind: 'native',
        message: `\`${inst.name}\` is usually unnecessary: use ${native}.`,
      });
    }
  }
  return findings;
}

module.exports = { parseInstalls, checkPackage, inspect, splitSegments, tokenize };
