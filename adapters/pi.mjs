// Tom n Jerry extension for Pi (packages/coding-agent/src/core/extensions/types.ts).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handle } = require('../core/engine.js');
const { classifyTool } = require('./tools.js');

// Findings are appended to the tool result the model reads next.
const CAPABILITIES = { toolContext: false, deliverAfterTool: true, sessionStart: false };

function sessionIdOf(ctx) {
  try { return ctx.sessionManager.getSessionId(); } catch { return null; }
}

export default function tomNJerry(pi) {
  const run = (ctx, input) => handle({
    harness: 'pi', cwd: ctx && ctx.cwd, sessionId: sessionIdOf(ctx), capabilities: CAPABILITIES, ...input,
  });
  const safe = fn => async (event, ctx) => {
    try { return await fn(event, ctx); } catch { return undefined; }
  };

  pi.on('session_start', safe(async (event, ctx) => {
    run(ctx, { event: 'sessionStart' });
  }));

  pi.on('before_agent_start', safe(async (event, ctx) => {
    const d = run(ctx, { event: 'prompt', prompt: event.prompt, systemInjection: true });
    if (!d.context) return undefined;
    const opts = event.systemPromptOptions;
    if (opts && opts.sections && typeof opts.sections === 'object') {
      opts.sections.tom_n_jerry = d.context;
      return undefined;
    }
    return { systemPrompt: `${event.systemPrompt}\n\n${d.context}` };
  }));

  pi.on('tool_call', safe(async (event, ctx) => {
    const d = run(ctx, { event: 'toolBefore', tool: classifyTool(event.toolName, event.input) });
    return d.block ? { block: true, reason: d.block.reason } : undefined;
  }));

  pi.on('tool_result', safe(async (event, ctx) => {
    const sc = event.structuredContent;
    const exit = sc && typeof sc === 'object' && Number.isInteger(sc.exit_code) ? sc.exit_code : undefined;
    const output = (event.content || []).map(c => (c && c.type === 'text' ? c.text : '')).join('\n');
    const d = run(ctx, { event: 'toolAfter', tool: classifyTool(event.toolName, event.input), result: { output, exitCode: exit } });
    if (!d.context) return undefined;
    return { content: [...(event.content || []), { type: 'text', text: d.context }] };
  }));

  pi.on('agent_before_settle', safe(async (event, ctx) => {
    if (event.context && event.context.canContinue === false) return undefined;
    const d = run(ctx, { event: 'stop' });
    if (!d.continue) return undefined;
    return {
      continue: true,
      entries: [{ type: 'custom_message', customType: 'tom-n-jerry', content: d.continue.reason, display: true }],
    };
  }));
}
