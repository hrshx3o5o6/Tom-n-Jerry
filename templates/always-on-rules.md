# TNJ: Tom n Jerry Loop Engine

YOU MUST RUN THIS LOOP EVERY TURN.

## State Machine

Every user request runs through these states in order. Each state has a mandatory output format.

```
                   User Request
                        │
                        ▼
                    ┌───────┐
        ┌───────────│  TOM   │
        │           │propose │
        │           └───┬───┘
        │               │
        │               ▼
        │           ┌───────┐
        │           │ LOOP- │  ← DECISION POINT
        │           │ CHECK │
        │           └───┬───┘
        │               │
        │        ┌──────┴──────┐
        │        │             │
        │   Scope expands  Scope same
        │        │             │
        │        ▼             │
        │   ┌────────┐         │
        │   │ JERRY  │         │
        │   │ scan   │         │
        │   └───┬────┘         │
        │       │              │
        │   ┌───┴────┐         │
        │   │ Card │  │        │
        │   └───┬────┘         │
        │       │              │
        └───┐───┘              │
            │                  │
            ▼                  │
        ┌───────┐              │
        │ IMPLE-│◄─────────────┘
        │  MENT │
        └───┬───┘
            │
            ▼
        ┌───────┐
        │RECEIPT│
        └───┬───┘
            │
            ▼
        ┌───────┐
        │TEACHER│  ← reflects, writes .tnj/loop-state.json
        └───┬───┘
            │
            └──────→ Back to TOM (next action or idle)
```

## State Definitions

### 1. Tom (Momentum)
Propose ONE concrete next action. Be specific.
"I'll add express-rate-limit middleware to /api/auth routes."
State the receipt: "I'll prove it worked by running curl -I /api/auth/login."

Write `.tnj/loop-state.json`:
```json
{ "step": "LOOP-CHECK", "proposal": "add express-rate-limit", "receipt": "curl -I /api/auth/login" }
```

### 2. LOOP-CHECK (Mandatory Decision Point)

Before implementing, you MUST declare whether the proposed action expands scope beyond the previous action.

**Scope expands (run JERRY) when:**
- New npm/pip/cargo/Go dependency
- New route files, controllers, or handlers
- Any auth, middleware, crypto, password, session management
- Database schema change (new column, table, migration)
- Framework config change (next.config, tailwind.config, application.properties)
- New UI component (not editing an existing one)
- Git history might reveal deleted code
- Unsure whether something exists in the codebase
- New file creation outside existing patterns

**Scope same (skip JERRY) when:**
- Editing a single function within a file already in scope
- Adding comments, renaming variables, formatting
- Continuing implementation of something that just passed RECEIPT — same file, same pattern
- Running tests or verification commands
- Pure refactoring that doesn't change behavior

**Output format:**
```
[LOOP-CHECK] Decision: YES | NO
Reasoning: <2-3 sentences explaining scope analysis>
```

Then write `.tnj/loop-state.json`:
```json
{ "step": "JERRY" | "IMPLEMENT" }
```

### 3. Jerry (Street Smarts)
Only runs when LOOP-CHECK returned YES (scope expands).

Read `.tnj/index.json`. Match the current task intent + tech stack to skill keywords.
For each matching skill: read `.tnj/skills/<skill>.md`, run its checks.
- If a shortcut exists → emit Opportunity Card → Tom implements the shortcut.
- If no shortcut → Tom implements directly.

Write `.tnj/loop-state.json`:
```json
{ "step": "IMPLEMENT", "opportunityCard": true | false }
```

### 4. Receipt (Proof)
After every implementation step, run the receipt command.
Capture stdout, stderr, exit code. Compare against expected.
If mismatch → diagnose and fix. If pass → confirm and proceed.

Write `.tnj/loop-state.json`:
```json
{ "step": "TEACHER", "lastReceipt": { "command": "curl ...", "result": "PASS" } }
```

### 5. Teacher (Learning)
After completing a full task (not each step), reflect:
- Did we discover a non-obvious pattern worth remembering?
- Would this apply to 2+ future tasks?
If yes → write `.tnj/learnings/<topic>.md` (concise, 5-15 lines).
Then append the new skill entry to `.tnj/index.json`.

Write `.tnj/loop-state.json`:
```json
{ "step": "TOM", "sessionComplete": false, "pendingActions": [], "learningsWritten": ["<topic>"] }
```

### 6. Loop
After Teacher → loop back to Tom for next action.
The loop never truly exits — it idles at TOM waiting for the next user request.

## Loop State File (`.tnj/loop-state.json`)

The model writes this file after EVERY state transition.
The model reads this file at the START of every turn to restore loop context.

If the file exists and `step` is `TOM` with no pending actions → fresh task, start full loop.
If the file exists and `step` is not `TOM` → resume from that state.
If the file doesn't exist → start fresh.

This enables multi-session persistence: Session A writes `{ step: "RECEIPT" }`, Session B resumes from RECEIPT.

## Opportunity Card Format

If shortcut found, response MUST start with:

**Opportunity Card**
**Type:** reuse | native | delete | shell | history | dependency | trap | defer
**Claim:** One sentence.
**Evidence:** File paths, command output.
**Move:** Exact action.
**Receipt:** Verification command.

If no shortcut found: "No opportunity found."

## Skill Index (`.tnj/index.json`)

Jerry reads this first to find relevant skills. Format:
```json
{
  "skills": [{
    "id": "descriptive-name",
    "trigger": "when-to-read",
    "keywords": ["intent", "tech", "context"],
    "path": "skills/name.md",
    "type": "generic|custom"
  }]
}
```

## Skill Creation Rules

- Save only patterns that apply to 2+ future tasks.
- Be concise: 5-15 lines. Include trigger condition, checks, example.
- File name: lowercase-hyphens.md
- Append entry to `.tnj/index.json` after writing.
- Skills in `.tnj/learnings/` with 2+ successful retrievals → promote to `.tnj/skills/` by updating index.json path.

## Anti-Traps

- Skipping Jerry without declaring LOOP-CHECK decision = violation.
- Running Jerry when scope is same = waste. Don't.
- Tom without Jerry = overbuilding. Always scan when scope expands.
- Jerry without Tom = analysis paralysis. Always implement after scanning.
- Receipt without a command = "it built" ≠ it works. Always run verification.
- Learning without a trigger = noise. Only save genuine patterns.
- Loop without state file write = state loss. Always write after every step.
