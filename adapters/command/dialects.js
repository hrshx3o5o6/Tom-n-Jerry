'use strict';

// Per-harness: native event name for each canonical event, and what the
// harness can do. `toolContext`: can inject model context before a tool runs.
// `deliverAfterTool`: can append context to a tool result. `sessionStart`: has a
// session-start event.
// `aliases`: other native events that map onto the same canonical event.
const HARNESSES = {
  claude: {
    dialect: 'claude',
    events: { sessionStart: 'SessionStart', prompt: 'UserPromptSubmit', toolBefore: 'PreToolUse', toolAfter: 'PostToolUse', stop: 'Stop' },
    // Failed tool calls fire PostToolUseFailure instead of PostToolUse.
    aliases: { toolAfter: ['PostToolUseFailure'] },
    capabilities: { toolContext: true, sessionStart: true },
  },
  codex: {
    dialect: 'claude',
    events: { sessionStart: 'SessionStart', prompt: 'UserPromptSubmit', toolBefore: 'PreToolUse', toolAfter: 'PostToolUse', stop: 'Stop' },
    capabilities: { toolContext: true, sessionStart: true },
  },
  hermes: {
    dialect: 'claude',
    events: { sessionStart: 'on_session_start', prompt: 'pre_llm_call', toolBefore: 'pre_tool_call', toolAfter: 'post_tool_call', stop: 'pre_verify' },
    // on_session_start is observe-only, so the full summary rides on the first pre_llm_call.
    capabilities: { toolContext: false, sessionStart: false },
  },
};

function claudeSerialize(decision, event, harness) {
  const native = HARNESSES[harness].events[event];
  if (decision.block && event === 'toolBefore') {
    if (harness === 'hermes') return { decision: 'block', reason: decision.block.reason };
    return {
      hookSpecificOutput: {
        hookEventName: native,
        permissionDecision: 'deny',
        permissionDecisionReason: decision.block.reason,
      },
    };
  }
  if (decision.continue && event === 'stop') {
    return { decision: 'block', reason: decision.continue.reason };
  }
  if (decision.context) {
    if (harness === 'hermes') {
      return event === 'prompt' ? { context: decision.context } : null;
    }
    if (event === 'toolAfter' || event === 'stop') return null;
    return { hookSpecificOutput: { hookEventName: native, additionalContext: decision.context } };
  }
  return null;
}

const SERIALIZERS = { claude: claudeSerialize };

function acceptsEvent(harness, event, native) {
  const h = HARNESSES[harness];
  return h.events[event] === native || ((h.aliases && h.aliases[event]) || []).includes(native);
}

module.exports = { HARNESSES, SERIALIZERS, acceptsEvent };
