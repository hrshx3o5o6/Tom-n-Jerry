'use strict';

const { handle } = require('../../core/engine');
const { classifyTool, resultOf } = require('../tools');
const { HARNESSES, SERIALIZERS } = require('./dialects');

const EVENTS = new Set(['sessionStart', 'prompt', 'toolBefore', 'toolAfter', 'stop']);

function parseArgs(argv) {
  const out = { event: argv[0] };
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--dialect') out.dialect = argv[++i];
    else if (argv[i] === '--harness') out.harness = argv[++i];
  }
  return out;
}

function normalize(payload, event, harness) {
  const p = payload && typeof payload === 'object' ? payload : {};
  const extra = p.extra && typeof p.extra === 'object' ? p.extra : {};
  const toolCall = p.toolCall && typeof p.toolCall === 'object' ? p.toolCall : {};
  const toolName = p.tool_name || p.toolName || toolCall.name;
  const toolInput = p.tool_input || p.toolInput || toolCall.args || toolCall.input || {};
  const workspace = Array.isArray(p.workspacePaths) ? p.workspacePaths[0] : undefined;
  return {
    event,
    harness,
    sessionId: p.session_id || p.sessionId || p.conversationId || extra.session_id || null,
    cwd: p.cwd || workspace || process.cwd(),
    prompt: p.prompt || p.user_message || extra.user_message || '',
    tool: toolName ? classifyTool(toolName, toolInput) : undefined,
    result: resultOf(p.tool_response || p.toolResponse || p.tool_output || p.result),
    stopHookActive: Boolean(p.stop_hook_active),
    capabilities: HARNESSES[harness].capabilities,
  };
}

// Pure: (argv, stdin text, env) → stdout text. Never throws.
function runHook(argv, stdinText, env = process.env) {
  try {
    const { event, dialect, harness } = parseArgs(argv);
    if (!EVENTS.has(event) || !HARNESSES[harness]) return '';
    const serialize = SERIALIZERS[dialect || HARNESSES[harness].dialect];
    if (!serialize) return '';
    let payload = {};
    if (stdinText && stdinText.trim()) {
      try { payload = JSON.parse(stdinText); } catch { return ''; }
    }
    const expected = HARNESSES[harness].events[event];
    if (payload.hook_event_name && payload.hook_event_name !== expected) return '';
    const decision = handle(normalize(payload, event, harness), env);
    const out = serialize(decision, event, harness);
    return out ? JSON.stringify(out) + '\n' : '';
  } catch {
    return '';
  }
}

// Async stdin read: readFileSync(0) throws EAGAIN on non-blocking pipes.
function readStdin() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) return resolve('');
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', () => resolve(''));
  });
}

function main(argv) {
  process.exitCode = 0;
  return readStdin().then(stdin => {
    const out = runHook(argv, stdin);
    if (out) process.stdout.write(out);
  }, () => {});
}

module.exports = { runHook, normalize, parseArgs, main };
