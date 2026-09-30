'use strict';

const path = require('path');
const { splitSegments, tokenize } = require('./jerry');

const DOC_EXTENSIONS = new Set([
  '.md', '.mdx', '.txt', '.rst', '.json', '.yaml', '.yml', '.toml', '.lock', '.log',
]);

const TRIVIAL = new Set([
  'ls', 'cat', 'pwd', 'echo', 'head', 'tail', 'which', 'cd', 'grep', 'rg', 'find', 'wc',
  'tree', 'less', 'more', 'printf', 'true', 'stat', 'file', 'sed', 'awk', 'sort', 'uniq',
]);
const TRIVIAL_GIT = new Set(['status', 'diff', 'log', 'show', 'branch', 'blame']);

function isVerification(cmd) {
  const segments = splitSegments(cmd);
  if (segments.length === 0) return false;
  return !segments.every(segment => {
    const [bin, sub] = tokenize(segment);
    if (!bin) return true;
    if (bin === 'git') return TRIVIAL_GIT.has(sub);
    return TRIVIAL.has(bin);
  });
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
