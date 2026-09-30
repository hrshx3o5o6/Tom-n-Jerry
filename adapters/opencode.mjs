// Tom n Jerry plugin for opencode (packages/plugin/src/index.ts `Hooks`).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handle } = require('../core/engine.js');
const { classifyTool } = require('./tools.js');

// System prompt is re-sent on every model call, so findings can be delivered
// on the very next call after the tool ran; the loop summary rides there too.
const CAPABILITIES = { toolContext: true, sessionStart: false };

export const TomNJerry = async ({ client, directory }) => {
  const turnContext = new Map();
  const pending = new Map();

  const run = input => handle({ harness: 'opencode', cwd: directory, capabilities: CAPABILITIES, ...input });
  const queue = (sessionID, text) => {
    if (!text) return;
    pending.set(sessionID, [...(pending.get(sessionID) || []), text]);
  };
  const safe = fn => async (...args) => {
    try { await fn(...args); } catch { /* fail open */ }
  };

  return {
    'chat.message': safe(async (input, output) => {
      const text = (output.parts || []).filter(p => p && p.type === 'text').map(p => p.text).join('\n');
      const d = run({ event: 'prompt', sessionId: input.sessionID, prompt: text, systemInjection: true });
      turnContext.set(input.sessionID, d.context || '');
    }),

    'experimental.chat.system.transform': safe(async (input, output) => {
      const sid = input.sessionID;
      if (!sid) return;
      const parts = [turnContext.get(sid), ...(pending.get(sid) || [])].filter(Boolean);
      pending.delete(sid);
      if (parts.length) output.system.push(parts.join('\n\n'));
    }),

    // Not wrapped in `safe`: in enforce mode the throw is what blocks the tool.
    'tool.execute.before': async (input, output) => {
      let d = {};
      try {
        d = run({ event: 'toolBefore', sessionId: input.sessionID, tool: classifyTool(input.tool, output.args) });
      } catch { return; }
      if (d.block) throw new Error(d.block.reason);
      queue(input.sessionID, d.context);
    },

    'tool.execute.after': safe(async (input, output) => {
      const exit = output && output.metadata && output.metadata.exit;
      run({
        event: 'toolAfter',
        sessionId: input.sessionID,
        tool: classifyTool(input.tool, input.args),
        result: { output: output && output.output, exitCode: Number.isInteger(exit) ? exit : undefined },
      });
    }),

    // opencode has no stop hook; session.idle is the closest boundary. A
    // continue is delivered as a follow-up prompt (bounded by the engine's
    // once-per-edit-batch and once-per-session rules).
    event: safe(async ({ event }) => {
      if (!event || event.type !== 'session.idle') return;
      const sid = event.properties && event.properties.sessionID;
      if (!sid) return;
      const d = run({ event: 'stop', sessionId: sid });
      if (d.continue) {
        await client.session.promptAsync({ path: { id: sid }, body: { parts: [{ type: 'text', text: d.continue.reason }] } });
      }
    }),
  };
};

export default TomNJerry;
