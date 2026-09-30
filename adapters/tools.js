'use strict';

// Maps every harness's tool names onto the engine's three kinds.
const SHELL = new Set([
  'bash', 'terminal', 'shell', 'run_shell_command', 'run_command', 'exec_command',
  'local_shell', 'execute_bash', 'exec',
]);
const EDIT = new Set([
  'write', 'edit', 'multiedit', 'notebookedit', 'write_file', 'patch', 'replace', 'apply_patch',
  'create_file', 'str_replace_editor', 'str_replace_based_edit_tool', 'write_to_file',
  'replace_file_content', 'multi_replace_file_content', 'edit_file', 'multi_edit',
]);

const COMMAND_FIELDS = ['command', 'cmd', 'CommandLine', 'commandLine', 'script'];
const PATH_FIELDS = ['file_path', 'filePath', 'path', 'notebook_path', 'TargetFile', 'target_file', 'AbsolutePath', 'filename'];
const PATCH_FILE_RE = /\*\*\* (?:Add|Update|Delete) File: ([^\n\r]+)/g;

function commandOf(input) {
  if (!input || typeof input !== 'object') return typeof input === 'string' ? input : '';
  for (const f of COMMAND_FIELDS) {
    const v = input[f];
    if (typeof v === 'string' && v) return v;
    if (Array.isArray(v) && v.length) {
      // ["bash", "-lc", "npm i x"] → the script; otherwise join argv.
      const i = v.findIndex(a => a === '-c' || a === '-lc');
      return i >= 0 && v[i + 1] ? String(v[i + 1]) : v.map(String).join(' ');
    }
  }
  return '';
}

function stringsIn(value, out = [], depth = 0) {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object' && depth < 4) {
    for (const v of Object.values(value)) stringsIn(v, out, depth + 1);
  }
  return out;
}

function pathsOf(input) {
  const paths = new Set();
  if (input && typeof input === 'object') {
    for (const f of PATH_FIELDS) if (typeof input[f] === 'string' && input[f]) paths.add(input[f]);
    if (Array.isArray(input.edits)) for (const e of input.edits) if (e && typeof e.file_path === 'string') paths.add(e.file_path);
  }
  // Codex apply_patch: file paths live inside the patch body.
  for (const s of stringsIn(input)) {
    for (const m of s.matchAll(PATCH_FILE_RE)) paths.add(m[1].trim());
  }
  return [...paths];
}

function classifyTool(name, input) {
  const n = String(name || '').toLowerCase();
  if (SHELL.has(n)) return { kind: 'shell', name, command: commandOf(input) };
  if (EDIT.has(n)) return { kind: 'edit', name, paths: pathsOf(input) };
  return { kind: 'other', name };
}

function resultOf(r) {
  if (r == null) return {};
  if (typeof r === 'string') return { output: r };
  const exit = [r.exit_code, r.exitCode, r.returncode, r.code, r.exit].find(v => Number.isInteger(v));
  let output = [r.stdout, r.stderr].filter(v => typeof v === 'string' && v).join('\n');
  if (!output) {
    if (typeof r.output === 'string') output = r.output;
    else if (Array.isArray(r.content)) output = r.content.map(c => (c && c.text) || '').join('\n');
    else if (typeof r.content === 'string') output = r.content;
  }
  return { output, exitCode: exit };
}

module.exports = { classifyTool, resultOf, commandOf, pathsOf };
