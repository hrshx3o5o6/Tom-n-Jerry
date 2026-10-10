'use strict';

const path = require('path');
const { splitSegments, tokenize } = require('./jerry');

const DOC_EXTENSIONS = new Set([
  '.md', '.mdx', '.txt', '.rst', '.json', '.yaml', '.yml', '.toml', '.lock', '.log',
]);

// A command counts as verification only if it actually exercises the code:
// a test/lint/type/build tool, a script run, or a request to a running service.
// Setup and housekeeping (mkdir, unzip, pip install, git add) never count.
const VERIFIER_BINS = new Set([
  'pytest', 'py.test', 'jest', 'vitest', 'mocha', 'ava', 'tap', 'playwright', 'cypress',
  'tsc', 'eslint', 'biome', 'prettier', 'ruff', 'mypy', 'pyright', 'flake8', 'pylint', 'black',
  'rspec', 'phpunit', 'curl', 'http', 'httpie', 'wget', 'make', 'ninja', 'cmake', 'rustc',
  'gcc', 'g++', 'clang', 'javac', 'gradle', 'gradlew', 'mvn', 'mvnw', 'tox', 'nox', 'shellcheck',
]);
const PKG_MANAGERS = new Set(['npm', 'pnpm', 'yarn', 'bun']);
const PKG_VERIFY_SCRIPTS = /^(test|tests|t|build|lint|check|typecheck|type-check|tsc|verify|ci|e2e|compile|validate|start|dev)(:.+)?$/;
const RUNNERS = new Set(['npx', 'bunx', 'pnpx']);
const WRAPPERS = new Set(['sudo', 'env', 'time', 'nice', 'timeout', 'command']);
const NOT_A_RUN_MODULES = new Set(['pip', 'venv', 'ensurepip', 'http.server', 'site']);
const SUBCOMMAND_VERIFIERS = {
  cargo: /^(test|build|check|clippy|bench|run|fmt)$/,
  go: /^(test|build|vet|run)$/,
  dotnet: /^(test|build|run)$/,
  deno: /^(test|check|lint|run)$/,
  swift: /^(test|build|run)$/,
  zig: /^(test|build)$/,
  mix: /^(test|compile)$/,
  rake: /^(test|spec)$/,
  bundle: /^exec$/,
  docker: /^(build|compose)$/,
};

function stripWrappers(tokens) {
  let i = 0;
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || WRAPPERS.has(tokens[i]) || /^\d+[smhd]?$/.test(tokens[i]))) i++;
  return tokens.slice(i);
}

function isScriptRun(rest) {
  const args = rest.slice(1);
  if (args.length === 0) return false;
  if (args.some(a => a === '--version' || a === '-V' || a === '--help' || a === '-h')) return false;
  const m = args.indexOf('-m');
  if (m >= 0) return !NOT_A_RUN_MODULES.has(args[m + 1]);
  if (args.includes('-c') || args.includes('-e') || args.includes('-p') || args.includes('--check') || args.includes('--eval')) return true;
  return args.some(a => !a.startsWith('-') || a === '-');
}

function segmentVerifies(segment) {
  const tokens = stripWrappers(tokenize(segment));
  const [bin, sub] = tokens;
  if (!bin) return false;
  const name = path.basename(bin);
  if (VERIFIER_BINS.has(name)) return true;
  if (/^\.{1,2}\//.test(bin) || path.isAbsolute(bin)) return true; // ./run-tests.sh, /abs/script
  if (PKG_MANAGERS.has(name)) {
    if (sub === 'run' || sub === 'run-script') return PKG_VERIFY_SCRIPTS.test(tokens[2] || '');
    if (sub === 'exec' || sub === 'x' || sub === 'dlx') return segmentVerifies(tokens.slice(2).join(' '));
    return PKG_VERIFY_SCRIPTS.test(sub || '');
  }
  if (RUNNERS.has(name)) return segmentVerifies(tokens.slice(tokens[1] === '--yes' || tokens[1] === '-y' ? 2 : 1).join(' '));
  if (name === 'uv' || name === 'poetry' || name === 'pipenv' || name === 'pdm' || name === 'hatch') {
    return sub === 'run' ? segmentVerifies(tokens.slice(2).join(' ')) : false;
  }
  if (name === 'git') return false;
  if (SUBCOMMAND_VERIFIERS[name]) return SUBCOMMAND_VERIFIERS[name].test(sub || '');
  if (/^python[0-9.]*$/.test(name) || /^(node|bun|deno|ruby|perl|php|Rscript|julia|lua)$/.test(name)) return isScriptRun(tokens);
  if (/^(bash|sh|zsh)$/.test(name)) return tokens.slice(1).some(a => !a.startsWith('-'));
  if (name === 'source' || name === '.') return false;
  return false;
}

function isVerification(cmd) {
  return splitSegments(cmd).some(segmentVerifies);
}

// 'edit' for code changes, 'learning' for Teacher output, null for anything the
// receipt gate should ignore (TNJ state, docs, config, files outside the root).
function classifyPath(root, file) {
  const abs = path.resolve(root, file);
  const relPath = path.relative(root, abs);
  if (!relPath || relPath.startsWith('..') || path.isAbsolute(relPath)) return null;
  const parts = relPath.split(path.sep);
  if (parts[0] === '.tnj') return parts[1] === 'learnings' ? 'learning' : null;
  if (DOC_EXTENSIONS.has(path.extname(abs).toLowerCase())) return null;
  return 'edit';
}

function mentionsLearnings(cmd) {
  return /\.tnj[\\/]learnings[\\/]/.test(cmd);
}

const RECEIPT_REASON = "Receipt: you changed code but haven't run anything that verifies it. Run the command that proves the change works (tests, a build, a curl), show its output, then finish.";

// Nudge once per batch of edits: only if an edit happened after the last
// verification AND after the last receipt nudge. Robust even when a harness
// fires the turn hook more than once per user turn.
function stopCheck(derived, cfg) {
  if (!cfg.receipts.gate) return null;
  if (derived.lastEdit < 0) return null;
  if (derived.lastEdit < derived.lastVerify) return null;
  if (derived.lastEdit < derived.lastReceiptNudge) return null;
  return RECEIPT_REASON;
}

module.exports = { isVerification, classifyPath, mentionsLearnings, stopCheck, RECEIPT_REASON };
