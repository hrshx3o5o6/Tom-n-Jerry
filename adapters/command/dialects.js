'use strict';

// Per-harness: native event name for each canonical event, and what the
// harness can do. `toolContext`: can inject model context before a tool runs.
// `deliverAfterTool`: can append context to a tool result. `sessionStart`: has a
// session-start event.
const HARNESSES = {
  claude: {
    dialect: 'claude',
    events: { sessionStart: 'SessionStart', prompt: 'UserPromptSubmit', toolBefore: 'PreToolUse', toolAfter: 'PostToolUse', stop: 'Stop' },
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
    capabilities: { toolContext: false, sessionStart: true },
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

module.exports = { HARNESSES, SERIALIZERS };
