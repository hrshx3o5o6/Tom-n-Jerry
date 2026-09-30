# Multi-Harness Hooks — Design

**Date:** 2026-09-29
**Status:** Draft, pending review
**Scope:** Move Tom n Jerry from an instruction-only integration (a block in opencode's `AGENTS.md`) to real lifecycle hooks, across six agent harnesses, behind one onboarding command.

---

## 1. Problem

Today TNJ works by appending a protocol block to `~/.config/opencode/AGENTS.md`. The model is *asked* to read `.tnj/loop-state.json` and run the Tom → Jerry → Receipt → Teacher loop. Nothing enforces it:

- The model can skip or forget the loop (long sessions, compaction, weak instruction-following).
- Receipts are self-reported by the model, not observed.
- Teacher fires only if the model decides to.
- Only opencode is supported.

Every major harness now ships a hook system that runs in the harness runtime, before and after the model acts. Hooks can inject context every turn, veto or rewrite tool calls, observe real tool output, and force one more turn before the agent stops. That is exactly the enforcement TNJ is missing.

## 2. Goals

1. The loop fires every turn, guaranteed by the harness — not by model compliance.
2. Jerry's dependency check is deterministic (code reads the lockfile), not model-judged.
3. Receipts are captured from real tool output.
4. Teacher has a deterministic trigger point.
5. Six harnesses: Claude Code, Codex CLI, Hermes Agent, opencode, Pi, Gemini CLI / Antigravity.
6. One command onboards a developer on whatever harnesses they use.
7. A bug in TNJ never breaks a user's session.

## 3. Non-goals

- Calling an LLM from inside a hook. Hooks stay fast and deterministic; anything needing judgement is handed back to the agent as context or a continue-nudge.
- Bypassing any harness's hook-trust mechanism.
- Changing skill *content*. This is a delivery-mechanism change; skill rules are untouched except for format migration.
- Network access from hooks.

## 4. Research summary

Full per-harness notes are in Appendix A. The finding that drives the design:

**Claude Code's command-hook JSON contract is the de facto standard.** Codex CLI implements it verbatim (same event names, same `hooks.json` shape, same `hookSpecificOutput` fields, and it loads `.claude-plugin/plugin.json`). Hermes shell hooks accept Claude-dialect output natively. Gemini CLI is a near-clone with renamed events and fields. Antigravity uses its own schema. opencode and Pi are in-process TypeScript APIs.

| Harness | Mechanism | Inject context | Block tool | Rewrite args | Force continue | Skills dir |
|---|---|---|---|---|---|---|
| Claude Code | command hook, JSON stdio | `additionalContext` on SessionStart, UserPromptSubmit, Pre/PostToolUse, Stop | exit 2 / `permissionDecision:"deny"` | `updatedInput` | Stop `decision:"block"` | `.claude/skills/` |
| Codex CLI | same contract | same | same | same | Stop block (verified, `hooks/src/events/stop.rs`) | `.agents/skills/` |
| Hermes | shell hook (accepts Claude dialect) / Python plugin | `pre_llm_call` → `context` | `action:"block"` / Claude dialect | `action:"modify"` | `pre_verify` → `continue` | `.agents/skills/` (trust) |
| Gemini CLI | command hook, JSON stdio | `BeforeAgent` `additionalContext` | `BeforeTool` `decision:"deny"` | `hookSpecificOutput.tool_input` | `AfterAgent` `decision:"deny"` | `.agents/skills/` |
| Antigravity | command hook, own schema | `PreInvocation` `injectSteps` | `PreToolUse` `decision:"deny"` | not supported | `Stop` `decision:"continue"` | `.agents/skills/` |
| opencode | in-process TS plugin | `experimental.chat.system.transform` | throw in `tool.execute.before` | mutate `output.args` | none (use `event` session.idle) | — |
| Pi | in-process TS extension | `before_agent_start` → `systemPromptOptions.sections` | `tool_call` → `{block}` | mutate `event.input` | `agent_before_settle` → `{continue}` | `.agents/skills/` |

## 5. Architecture

```
                 ┌─────────────────────────────────────┐
                 │ core/engine.js  (pure, zero deps)    │
                 │                                      │
                 │ handle(event, input, env) → Decision │
                 │   events: sessionStart | prompt |    │
                 │           toolBefore | toolAfter |   │
                 │           stop                       │
                 │   Decision: { context?, block?,      │
                 │     continue? }                      │
                 │ reads/writes .tnj/ only              │
                 └──────────────────┬──────────────────┘
      ┌─────────────────────────────┼───────────────────────────┐
      ▼                             ▼                           ▼
 command adapter              opencode adapter             Pi adapter
 `tomnjerry hook <evt>`       adapters/opencode.ts         adapters/pi.ts
  --dialect claude  → Claude Code, Codex, Hermes
  --dialect gemini  → Gemini CLI
  --dialect agy     → Antigravity
```

### 5.1 Engine (`core/`)

Pure CommonJS, zero runtime dependencies, Node ≥ 18 (matches current package). Split by TNJ role so each unit is testable alone:

| Module | Responsibility |
|---|---|
| `core/engine.js` | `handle(event, input, env)` — dispatch to roles, merge decisions, checkpoint time budget, fail-open wrapper |
| `core/root.js` | Resolve project root and session id (§5.1.1) |
| `core/session.js` | Append/read the engine-owned session event log (§5.1.2) |
| `core/config.js` | Load `.tnj/config.json` over `~/.tnj/config.json` over defaults |
| `core/tom.js` | Build per-turn context: loop summary + `loop-state.json` (read-only) + skills matched from `index.json` by prompt keywords |
| `core/jerry.js` | Parse install commands from tool input; check manifests/lockfiles; return finding |
| `core/receipt.js` | Append tool outcomes to `.tnj/receipts.jsonl`; decide the stop-time verification nudge |
| `core/teacher.js` | Decide whether to nudge a learning write-up at stop |
| `core/skills.js` | Keyword match against `index.json` (read-only) |

#### 5.1.1 Project root and session id

- **Root:** first of `CLAUDE_PROJECT_DIR`, `GEMINI_PROJECT_DIR` (only these named variables are read), else walk up from `cwd` to the first directory containing `.tnj/`, else `.git`, else `package.json`, else `cwd`. `cwd` alone is never trusted — it moves after `cd` inside a shell tool.
- **Session id:** the harness-provided `session_id` / `sessionID` / `conversationId`. If absent, read `.tnj/current-session` (rewritten with a fresh random id on every `sessionStart`); if that is also absent, `"default"`. P0 verifies which harnesses need the fallback (Hermes shell hooks pass `session_id`; confirm on capture).

#### 5.1.2 State ownership and concurrency

Two owners, never mixed:

| File | Owner | Engine access |
|---|---|---|
| `.tnj/loop-state.json`, `.tnj/index.json`, `.tnj/learnings/*` | the model (via the loop protocol) | read-only |
| `.tnj/sessions/<sessionId>.jsonl` | engine | append-only |
| `.tnj/receipts.jsonl`, `.tnj/errors.log` | engine | append-only |
| `.tnj/current-session` | engine | overwritten on `sessionStart` only (single writer) |

Harnesses (Claude Code, Codex) run hooks for parallel tool calls concurrently, so the engine **never does read-modify-write**. Every fact is one line written with a single `write` on an `O_APPEND` descriptor (`fs.appendFileSync`), kept under 4 KB by truncating `cmd` to 1,000 chars and output tails to 500 — this applies to `receipts.jsonl` too. Session log:

```jsonl
{"t":1727600000000,"e":"prompt"}
{"t":…,"e":"jerry","pkg":"express-rate-limit","where":"package.json:23"}
{"t":…,"e":"edit","path":"src/routes/auth.js"}
{"t":…,"e":"shell","cmd":"npm test","exit":0,"verify":true}
{"t":…,"e":"learning","path":".tnj/learnings/rate-limit.md"}
{"t":…,"e":"nudge","kind":"receipt"}
```

Derived state is computed by scanning the current session's log (small; one session):
- `turn` = number of `prompt` events; "this turn" = events after the last `prompt`.
- `continuesThisTurn` = `nudge` events this turn.
- `teacherNudged` = any `nudge` with `kind:"teacher"` this session.
- `lastEdit` / `lastVerify` = latest `edit` / `shell` with `verify:true`.
- `learningsTouched` = any `learning` event this session.

On `sessionStart` the engine deletes `sessions/*.jsonl` older than 7 days. `index.json` `usageCount` is no longer bumped by hooks (it raced and caused git churn).

#### 5.1.3 Repos without `.tnj/`

A global install fires in every repo. If no `.tnj/` exists at the resolved root, the engine emits a short notice on `sessionStart` only ("Tom n Jerry is installed but this repo has no `.tnj/`; run `tomnjerry setup --project` to enable Jerry and receipts") — once per session by construction, no state needed — and **writes nothing** on any event. Harnesses without a session-start event get no notice. No lazy scaffolding.

**Normalized input** (adapters must produce this):

```js
{
  event: 'sessionStart' | 'prompt' | 'toolBefore' | 'toolAfter' | 'stop',
  sessionId: string,
  cwd: string,
  prompt?: string,                 // prompt
  tool?: { kind: 'shell' | 'write' | 'edit' | 'other', name: string, input: object },
  result?: { output: string, exitCode?: number },   // toolAfter
  harness: 'claude' | 'codex' | 'hermes' | 'gemini' | 'agy' | 'opencode' | 'pi'
}
```

`tool.kind` is resolved by the adapter from harness tool names (`Bash`/`bash`/`terminal`/`run_command`/`run_shell_command` → `shell`; `Write`/`write`/`write_file` → `write`; etc.). The engine never sees harness-specific tool names.

**Decision** (engine output):

```js
{
  context?: string,                 // text to inject for the model
  block?: { reason: string },       // veto the tool call
  continue?: { reason: string }     // at stop: force one more turn
}
```

Arg rewriting is deliberately absent — no role needs it.

### 5.2 Role behaviour

**Tom — `sessionStart`, `prompt`**
- Emit `context`: a compact loop summary (≤ 1,500 chars, not the 230-line `always-on-rules.md`) + current `loop-state.json` + names and one-line descriptions of skills matched by keywords in the prompt.
- Skill bodies are *not* injected; they are installed as native skills (§5.5) and loaded by the harness on demand. This keeps per-turn context small and prompt-cache friendly.

**Jerry — `toolBefore`**
- Only acts on `tool.kind === 'shell'`. Parses the command for install verbs: `npm install|i|add`, `pnpm add`, `yarn add`, `bun add`, `pip install`, `uv add`, `poetry add`, `cargo add`, `go get`, `gem install`, `bundle add`.
- For each named package, checks: `package.json` (deps, devDeps), lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`), `requirements*.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`. Plain substring/regex parsing — no YAML/TOML parser dependency.
- Also flags stdlib/native replacements from a small static table (e.g. `uuid` → `crypto.randomUUID`, `flatpickr` → `<input type="date">`, `lodash.clonedeep` → `structuredClone`).
- Bare `npm install` with no package args is ignored (that's a restore, not an add).
- Mode from `.tnj/config.json`:
  - `advise` (**default**): `context` = "Jerry: `express-rate-limit` is already in package.json (line 23). Use it instead of installing." Tool proceeds.
  - `enforce`: `block` with the same reason.
  - `off`: no-op.

**Receipt — `toolAfter`, `stop`**
- Tool-kind and path extraction per harness (adapter responsibility):
  - Claude Code: `Write`/`Edit`/`MultiEdit` → `edit`, path from `tool_input.file_path`; `Bash` → `shell`, `tool_input.command`.
  - Codex: `apply_patch` → `edit`, one path per `*** Add File:` / `*** Update File:` / `*** Delete File:` line in the patch body; `Bash` → `shell`.
  - Hermes: `write_file`/`patch` → `edit` (path from `path` arg); `terminal` → `shell`. Tool and arg names confirmed by golden fixture before P0 ships.
- `toolAfter` on `write`/`edit`: log an `edit` event **only for code edits** — path outside `.tnj/` and extension not in the doc/config ignore list (`.md .mdx .txt .rst .json .yaml .yml .toml .lock .log`). Writes to `.tnj/loop-state.json` (which the protocol asks the model to update every step) therefore never trip the gate. Writes under `.tnj/learnings/` log a `learning` event instead.
- `toolAfter` on `shell`: append `{ts, sessionId, cmd, exitCode, outputTail(500)}` to `.tnj/receipts.jsonl`, and log a `shell` event with `verify:true` unless the command is trivially read-only — every segment (split on `&&`, `;`, `|`) starts with one of `ls cat pwd echo head tail which cd git status git diff git log`. Deliberately permissive: any non-trivial command after the last edit counts as verification. TNJ doesn't judge test quality.
- `stop`: if `lastEdit` is later than `lastVerify` this turn, return `continue` once per turn: "Receipt: you changed code but haven't run anything to verify it. Run the check that proves it works, then finish." Skipped if mode is `off` or `receipts.gate: false`.

**Teacher — `stop`**
- If ≥ 1 `jerry` event this session, no `learning` event this session, and not `teacherNudged` → return `continue`: "Teacher: Jerry found <n> shortcuts this session. If any is a reusable pattern, write it to `.tnj/learnings/<slug>.md` and register it in `.tnj/index.json`; otherwise just finish." Log `nudge kind:teacher`.
- `learning` events also come from shell commands whose text references `.tnj/learnings/` (for harnesses where the model writes files through the shell).
- Receipt nudge takes priority over Teacher; at most one `continue` per turn.

`sessionEnd` is not used in P0.

### 5.3 Safety invariants

1. **Fail open.** Every adapter wraps the engine: any throw, parse error or budget overrun → empty decision, exit 0, error appended to `.tnj/errors.log` (only if `.tnj/` exists). TNJ never blocks by accident.
2. **Time budget.** Checkpoint-based: the engine checks elapsed time between steps (manifest reads, log scan) and returns the empty decision past 1,500 ms. Node can't preempt synchronous work, so each step is kept small. Hook timeouts in generated configs are 10 s.
3. **No loops.** Max one `continue` per turn; Teacher max once per session (§5.1.2). In the `claude` dialect, `stop_hook_active: true` on the Stop payload → never continue.
4. **No secrets, no network.** Engine reads only: project manifests/lockfiles, `.tnj/`, `~/.tnj/config.json`, and the named project-dir variables in §5.1.1. No other environment values.
5. **Writes confined to `.tnj/`.** The engine never edits project source, and never writes `loop-state.json`, `index.json` or learnings.
6. **Stdout discipline.** Command adapter writes exactly one JSON object (or nothing) to stdout; diagnostics go to stderr. Required by Gemini CLI; harmless elsewhere.

### 5.4 Adapters

**Command adapter — `tomnjerry hook <event> --dialect <d>`**

Reads stdin JSON, normalizes, calls engine, serializes. One code path, three serializers. Full form: `tomnjerry hook <event> --dialect <d> --harness <h>` — `--harness` is **required** in every generated command (it fills `harness` and selects tool-name mapping; `claude` dialect alone can't distinguish Claude Code / Codex / Hermes). `<event>` is always the **canonical** name (`prompt`, `toolBefore`, …) — generated configs map native events to canonical argv. The `claude` dialect cross-checks `hook_event_name` on stdin and exits 0 silently on mismatch (misconfiguration must not act).

Generated matchers keep hooks off hot paths: `toolBefore` only on the harness's shell tool (`Bash` / `terminal` / `run_shell_command` / `run_command`); `toolAfter` only on shell + write/edit tools (`Bash|Write|Edit|MultiEdit` for Claude Code; `Bash|apply_patch` for Codex).

| Canonical | `claude` (Claude Code, Codex, Hermes) | `gemini` | `agy` |
|---|---|---|---|
| sessionStart | `SessionStart` → `hookSpecificOutput.additionalContext` | `SessionStart` → `additionalContext` | — (use first `PreInvocation`) |
| prompt | `UserPromptSubmit` → `additionalContext` | `BeforeAgent` → `additionalContext` | `PreInvocation` → `injectSteps[{ephemeralMessage}]` |
| toolBefore | `PreToolUse` → `additionalContext` or `permissionDecision:"deny"` + reason | `BeforeTool` → `additionalContext` or `decision:"deny"` | `PreToolUse` → `decision:"deny"` (advise mode: no-op, context deferred to next `PreInvocation`) |
| toolAfter | `PostToolUse` (observe only) | `AfterTool` | `PostToolUse` |
| stop | `Stop` → `decision:"block"`, `reason` | `AfterAgent` → `decision:"deny"`, `reason` | `Stop` → `decision:"continue"` |

Hermes consumes the `claude` dialect through its shell-hook config (`~/.hermes/config.yaml`), mapping Hermes event names to canonical argv: `on_session_start` → `sessionStart`, `pre_llm_call` → `prompt`, `pre_tool_call` → `toolBefore`, `post_tool_call` → `toolAfter`, `pre_verify` → `stop`. Hermes' `pre_llm_call` expects `{"context": ...}`, so with `--harness hermes` the adapter emits that shape for `prompt`; all other Hermes events use unmodified `claude` output. The Hermes `hook_event_name` cross-check uses Hermes names. Whether Hermes `pre_verify` honours Claude's `decision:"block"` (vs needing `{"action":"continue"}`) is unconfirmed — pinned by golden fixture before P0 ships; fallback is emitting the Hermes-native shape under `--harness hermes`.

**opencode adapter — `adapters/opencode.ts`** (published inside the package, referenced from `opencode.json` `"plugin"`)
- `experimental.chat.system.transform` → engine `prompt`; push `context` onto `output.system`.
- `tool.execute.before` → engine `toolBefore`; enforce → throw `Error(reason)`; advise → context is queued and emitted on next system transform (opencode has no per-tool context injection).
- `tool.execute.after` → engine `toolAfter`.
- `event` with `session.idle` → engine `stop`; `continue` delivered via `client.session.prompt` (verify in P1 — fallback: queue for next turn).

**Pi adapter — `adapters/pi.ts`** (listed in `package.json` `"pi": {"extensions": [...]}`)
- `before_agent_start` → engine `prompt`; write `context` to `systemPromptOptions.sections.tnj`.
- `tool_call` → engine `toolBefore`; enforce → `{block: true, reason}`; advise → queue for next section write.
- `tool_result` → engine `toolAfter`.
- `agent_before_settle` → engine `stop`; `{continue: true, entries: [...]}`.

### 5.5 Skills migration

Current: flat `tnj/skills/<id>.md`, catalog `tnj/index.json`.
New: `tnj/skills/<id>/SKILL.md` with agentskills.io frontmatter:

```markdown
---
name: dependency-jerry
description: Before adding any package, check lockfile, stdlib and native platform first. Use when installing npm/pip/cargo/go dependencies.
---
<existing body unchanged>
```

- **Canonical copy:** package `tnj/skills/<id>/SKILL.md`, scaffolded into the project as `.tnj/skills/<id>/SKILL.md`. `index.json` `path` fields become `skills/<id>/SKILL.md` (still relative to `.tnj/`).
- **Derived copies:** `setup` also copies to `.agents/skills/tnj-<id>/` (Codex, Gemini, Antigravity, Pi, Hermes) and/or `.claude/skills/tnj-<id>/` (Claude Code), only for selected harnesses. `tnj-` prefix avoids clobbering user skills and makes removal exact. Copies, not symlinks (Windows).
- `.tnj/learnings/*.md` remain plain markdown matched via `index.json`, as today.
- Migration of the 13 source files is a one-off repo change, not an install-time step.
- `runDoctor`'s `REQUIRED_SKILLS` check and `runInit`'s copy are updated to the directory layout; `package.json` `files` gains `core`, `adapters`.
- The protocol text embedded in `bin/tomnjerry.js` (`TNJ_GLOBAL_BLOCK`, which `init`/`install-global` still write in P0) and `templates/always-on-rules.md` are updated: skill paths become `skills/<id>/SKILL.md`, and the retrieval-count promotion language is removed (usage counts are gone).

### 5.6 Fallback: instruction block

The existing AGENTS.md block remains, trimmed to a pointer ("TNJ hooks are active; if you see no `[TNJ]` context this turn, read `.tnj/loop-state.json` and follow the loop"). Written only for harnesses where hooks couldn't be installed or verified. Covers enterprise `allow_managed_hooks_only` (Codex), untrusted project hooks, and unknown harnesses.

## 6. Onboarding

### 6.1 `npm i -g @hrshx3o5o6/tomnjerry && tomnjerry setup`

Global install is step one because hook configs point at an absolute path that must outlive the command (see below). `npx @hrshx3o5o6/tomnjerry setup` works too: it detects the ephemeral cache, asks for consent, runs `npm i -g @hrshx3o5o6/tomnjerry`, then continues from the global install. Declined → prints the two-line manual command and exits.

1. **Detect** harnesses: `~/.claude/`, `~/.codex/`, `~/.hermes/`, `~/.gemini/`, `~/.pi/`, `~/.config/opencode/`, plus binaries on `PATH` (`claude`, `codex`, `hermes`, `gemini`, `agy`, `pi`, `opencode`).
2. **Ask** (interactive; `--yes` and `--harness a,b` for non-interactive): which harnesses, global (all projects) or this project only.
3. **Write** per harness:
   - Claude Code: hooks in `~/.claude/settings.json` or `.claude/settings.json` (merged, never clobbered; TNJ entries tagged by command string for idempotent re-runs and removal).
   - Codex: `~/.codex/hooks.json` or `.codex/hooks.json`.
   - Hermes: `hooks:` block appended to `~/.hermes/config.yaml` inside marker comments (no YAML dependency). If the file already has a top-level `hooks:` key, `setup` does **not** edit it — it prints the exact snippet for the user to merge by hand (a second `hooks:` key is invalid or silently overrides).
   - Gemini CLI: `hooks` in `~/.gemini/settings.json` or `.gemini/settings.json`.
   - Antigravity: `~/.gemini/config/hooks.json` or `.agents/hooks.json`.
   - opencode: `"plugin"` entry in `opencode.json`.
   - Pi: `pi install npm:@hrshx3o5o6/tomnjerry` printed as next step (Pi owns its package install).
   - All (project scope): `.tnj/` scaffold including `.tnj/.gitignore` covering `sessions/`, `receipts.jsonl`, `errors.log`, `current-session`; derived skill copies (§5.5).
4. **Back up** every file before modifying it (`<file>.tnj-backup-<ts>`).
5. **Trust step** — print exact instructions; never automate:
   - Codex: open Codex, run `/hooks`, trust TNJ hooks (they are silently inactive until trusted).
   - Gemini CLI: project hooks require re-trust after any change.
   - Hermes: approve on first use, or `hooks_auto_accept: true` if the user chooses.
   - Hermes/Pi project skills: `hermes skills trust` / Pi project trust.
6. **Verify** with `tomnjerry doctor`.

Hook commands are written as `node "<absolute path to installed bin/tomnjerry.js>" hook <event> --dialect <d>` — resolved at setup time from the running package. **Never `npx`** (seconds of latency on every tool call). If `setup` is running from an ephemeral `npx` cache, it never writes that path (it will vanish) — it takes the consented global-install route above. `doctor` re-checks the path exists after upgrades.

**Platforms:** P0 supports macOS and Linux. Windows is best-effort: the command generator quotes paths and uses `node "<path>"` (no reliance on `.cmd` shims), covered by a unit test, but no Windows e2e until requested.

### 6.2 `tomnjerry doctor`

Per configured harness: config present and parseable → TNJ entries present → pipe a synthetic payload through `tomnjerry hook` in that dialect and validate output shape → report trust-step status where detectable (e.g. Codex `trusted_hash` present). Exit non-zero on failure.

### 6.3 `tomnjerry remove [--harness …]`

Removes only TNJ-tagged entries; restores nothing else. `.tnj/` left in place unless `--purge`.

### 6.4 Command surface after this change

| Command | Status |
|---|---|
| `setup` | new — recommended path |
| `init` | kept, current behaviour (scaffold `.tnj/` for opencode + AGENTS.md users), updated for the new skill layout and `.gitignore`; becomes a `setup` alias in P1 when opencode hooks land. Bare `tomnjerry` with no args still runs `init`, unchanged. |
| `install-global` / `remove-global` | kept, deprecated — print pointer to `setup` / `remove` |
| `hook <event> --dialect <d> --harness <h>` | new — internal, invoked by harnesses |
| `doctor` | extended |
| `remove` | new |
| `stats` | new (P3) — summarize `receipts.jsonl` + Jerry findings |

## 7. Configuration — `.tnj/config.json`

```json
{
  "mode": "advise",
  "receipts": { "gate": true },
  "teacher": { "nudge": true },
  "jerry": { "nativeReplacements": true }
}
```

Missing file = these defaults. Global override at `~/.tnj/config.json`, project wins.

## 8. Packaging

Single npm package `@hrshx3o5o6/tomnjerry`:

```
bin/tomnjerry.js           CLI (setup, hook, doctor, remove, stats, init…)
core/                      engine (§5.1)
adapters/command/          dialect serializers
adapters/opencode.ts       opencode plugin
adapters/pi.ts             Pi extension
tnj/skills/<id>/SKILL.md   migrated skills (canonical, §5.5)
tnj/index.json             catalog
templates/                 fallback AGENTS.md block, loop summary
.claude-plugin/plugin.json + marketplace.json   Claude Code + Codex plugin listing (P3)
gemini-extension.json                            Gemini CLI extension listing (P3)
```

`package.json` additions: `"pi": {"extensions": ["adapters/pi.ts"], "skills": ["tnj/skills"]}` (P1), keyword `pi-package`, `files` updated. `@opencode-ai/plugin` and Pi host packages as optional `peerDependencies` (types only). Runtime deps remain zero.

## 9. Phases

| Phase | Deliverables | Harnesses live |
|---|---|---|
| **P0** | Engine (§5.1–5.3), `claude` dialect, skills migration (§5.5), `setup` / `doctor` / `remove` for Claude Code, Codex, Hermes, `.tnj/config.json`, golden-fixture tests | Claude Code, Codex, Hermes (+ opencode unchanged via AGENTS.md) |
| **P1** | opencode adapter (replaces AGENTS.md path), Pi adapter, `setup`/`doctor` support for both | + opencode (hooks), Pi |
| **P2** | `gemini` and `agy` dialects, `setup`/`doctor` support | + Gemini CLI, Antigravity |
| **P3** | Marketplace manifests (`.claude-plugin/`, `gemini-extension.json`, Pi gallery keyword, Antigravity `plugin.json`), `tomnjerry stats`, README/landing/compatibility docs | discovery channels |

## 10. Testing

- **Engine unit tests** (`node:test`, no framework dependency): each role against fixture repos — reuse `benchmarks/agentic/fixtures/node-express` (has `express-rate-limit`), `react-vite`, `python-django`. Cases: dep present / absent / bare `npm install` / multi-package command / scoped packages / enforce vs advise vs off / no manifest.
- **Golden fixtures per dialect**: `test/fixtures/<dialect>/<event>.in.json` → `.out.json`. Inputs are real payloads captured from each harness during P0/P2 verification (not hand-written from docs), which pins field names the research could only confirm through summarizers.
- **Safety tests**: engine throws → adapter exits 0 with empty stdout; budget overrun → empty decision; malformed stdin → exit 0.
- **Loop-guard tests**: repeated `stop` in one turn yields at most one `continue`; Teacher at most once per session.
- **Setup tests**: run against temp `HOME` with pre-existing user configs; assert merge not clobber, backups created, idempotent re-run, and after `remove` the config is **semantically equal** (deep-equal parsed JSON; line-equal for YAML) to the pre-setup content. Hermes: existing top-level `hooks:` → file untouched, snippet printed.
- **Concurrency test**: 20 parallel `hook toolAfter` processes against one session → 20 intact log lines.
- **Command-string test**: generated hook commands quote paths with spaces correctly (POSIX + Windows forms).
- **Manual e2e matrix** before each release: one real session per live harness on the `node-express` fixture — ask for rate limiting, confirm Jerry context appears, receipt logged, stop nudge fires once.
- `npm test` switches from `doctor && --version` to the `node:test` suite.

## 11. Risks and open questions

| Risk | Mitigation |
|---|---|
| Field names for Claude Code / Antigravity came via doc summarizers | Golden fixtures from captured real payloads before each dialect ships |
| Codex hooks silently inactive until trusted | `setup` prints the trust step prominently; `doctor` checks for `trusted_hash` |
| Codex enterprise `allow_managed_hooks_only` | AGENTS.md fallback block (§5.6) |
| opencode has no stop hook with continue semantics | Receipt/Teacher nudges delivered via `session.idle` + client prompt; verify in P1, degrade to next-turn context |
| Antigravity can't rewrite or inject per tool | Advise-mode context deferred to next `PreInvocation` |
| Node cold start on every tool call | Absolute `node` path, never `npx`; matchers restrict to shell/write tools; measure in P0 (target < 150 ms p50) |
| Parallel hooks losing updates | Append-only session logs, no read-modify-write (§5.1.2) |
| Hook stdin/stdout contracts evolve | Dialects isolated in serializers; golden fixtures catch drift |
| Users with heavy existing hook configs | Merge by tagged entries, backups, `remove` |

**Open (decide during P1):** whether opencode `session.idle` → `client.session.prompt` counts as "continue" or should only queue context for the user's next message.

## Appendix A — Sources

- opencode: `packages/plugin/src/index.ts` (sst/opencode, `dev`), `Hooks` interface.
- Claude Code: code.claude.com/docs/en/hooks, /memory, /skills, /plugins-reference, /plugins/marketplace-reference.
- Codex CLI: openai/codex `codex-rs/config/src/hook_config.rs`, `codex-rs/hooks/src/engine/discovery.rs`, `codex-rs/hooks/schema/generated/*.json`, `codex-rs/ext/skills/src/host_roots.rs`, `codex-rs/exec-server-protocol/src/lib.rs`, `core-plugins/src/manifest.rs`.
- Hermes: NousResearch/hermes-agent `hermes_cli/plugins.py`, `agent/shell_hooks.py`, `plugins/AGENTS.md`, `website/docs/developer-guide/plugins/index.md`.
- Gemini CLI: google-gemini/gemini-cli `docs/hooks/reference.md`, `docs/extensions/reference.md`, `docs/cli/skills.md`.
- Antigravity: antigravity.google/docs/hooks, /docs/plugins.
- Pi: earendil-works/pi (formerly badlogic/pi-mono) `packages/coding-agent/src/core/extensions/types.ts`, `configuration.md`, `skills.md`, `packages.md`.
