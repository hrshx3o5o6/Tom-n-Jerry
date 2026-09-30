# Compatibility

Tom n Jerry runs one engine (`core/`) behind three kinds of adapter:

- **Command hooks** (`tomnjerry hook <event> --dialect <d> --harness <h>`): Claude Code, Codex CLI, Hermes Agent, Gemini CLI, Antigravity.
- **In-process plugin** (`adapters/opencode.mjs`): opencode.
- **In-process extension** (`adapters/pi.mjs`): Pi.

`tomnjerry setup` wires all of them. `tomnjerry doctor` runs each installed hook for real against a scratch project.

## Status

"Verified" says how each harness's contract was checked. Every row is also covered by replay tests in `test/fixtures/`.

| Harness | Config written by `setup` | Verified against |
|---|---|---|
| Claude Code | `~/.claude/settings.json` (`--project-hooks`: `.claude/settings.local.json`) | Live headless sessions (hooks + `--plugin-dir`), captured payloads |
| Codex CLI | `~/.codex/hooks.json` | `codex-rs/hooks/schema/generated/*.json` and `core/src/tools` source |
| Hermes Agent | `hooks:` block in `~/.hermes/config.yaml` | `agent/shell_hooks.py`, `hermes_cli/plugins.py` source |
| opencode | `~/.config/opencode/plugins/tomnjerry.js` | `packages/plugin/src/index.ts`; live load under Bun |
| Pi | `~/.pi/agent/extensions/tomnjerry.js` | `extensions/types.ts`; live session (system prompt injection) |
| Gemini CLI | `~/.gemini/settings.json` | `docs/hooks/reference.md`; the real CLI accepted the generated hooks |
| Antigravity | `~/.gemini/config/hooks.json` (`--project-hooks`: `.agents/hooks.json`) | antigravity.google/docs/hooks; live headless session ran the full loop |

## What each role can do per harness

| | Inject context | Block an install (enforce) | Deliver Jerry advice | Force one more turn |
|---|---|---|---|---|
| Claude Code | every turn | `permissionDecision: deny` | before the command runs | `Stop` → `decision: block` |
| Codex CLI | every turn | `permissionDecision: deny` | before the command runs | `Stop` → `decision: block` |
| Hermes | first model call of each turn | `decision: block` | next turn | `pre_verify` → continue |
| opencode | system prompt, every model call | throws in `tool.execute.before` | next model call | follow-up prompt on `session.idle` |
| Pi | system prompt section | `tool_call` → `{ block }` | appended to the tool result | `agent_before_settle` → `{ continue }` |
| Gemini CLI | every turn | `BeforeTool` → `deny` | appended to the tool result | `AfterAgent` → `deny` (retry) |
| Antigravity | `PreInvocation` → `injectSteps` | `PreToolUse` → `deny` | next model call | `Stop` → `decision: continue` |

## Harness-specific notes

- **Codex:** new hooks stay inactive until you trust them. Open Codex and run `/hooks`. If your admin sets `allow_managed_hooks_only`, user hooks are ignored. Use `tomnjerry init` plus the AGENTS.md block instead.
- **Hermes:** shell hooks ask for consent on first use. If `config.yaml` already has a top-level `hooks:` key, `setup` leaves the file alone and prints the entries for you to merge.
- **Gemini CLI:** project-level hooks must be trusted again whenever they change. `hooksConfig.enabled: false` turns all hooks off, and `doctor` warns about it.
- **Antigravity:** TNJ never answers `PreToolUse` with `allow`, because that would auto-approve the tool and skip your permission settings.
- **opencode:** the plugin replaces the older `AGENTS.md` protocol block, and `setup` removes that block (keeping a backup).

## Without hooks

For harnesses without hooks, or where hooks are disabled by policy, the loop still works as instructions. `tomnjerry init` scaffolds `.tnj/`, and `tomnjerry install-global` writes the protocol to opencode's `AGENTS.md`. The skills in `.tnj/skills/<id>/SKILL.md` follow the [agentskills.io](https://agentskills.io) format, so any harness that loads skills can use them.
