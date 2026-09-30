[TNJ LOOP ENFORCEMENT] You MUST read .tnj/loop-state.json FIRST before any other tool. The FIRST tool call of every turn MUST restore loop context.

---

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
         │ IMPLE- │◄─────────────┘
         │  MENT  │
         └───┬───┘
             │
             ▼
         ┌───────┐
         │RECEIPT│
         └───┬───┘
             │
             ▼
         ┌───────┐
         │TEACHER│  ← MUST produce output after EVERY task
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

Read `.tnj/index.json` — the FULL catalog including any learnings entries. Match the current task intent + tech stack against ALL entries' trigger + keywords.

For each matching entry:
- If `path` starts with `skills/` → read `.tnj/skills/<skill>/SKILL.md`
- If `path` starts with `learnings/` → read `.tnj/learnings/<topic>.md`

Run the checks from the loaded file.
- If a shortcut exists → emit Opportunity Card → Tom implements the shortcut.
- If no shortcut → Tom implements directly.

**Never skip learnings.** Learnings accumulate across projects and contain the most task-specific patterns. Check them on every JERRY scan.

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

Then Teacher runs and MUST produce output (see Teacher step).

### 5. Teacher (Learning)
After every task completion (Receipt passed), Teacher MUST produce output:

**Option A — Learning found:**
Write `.tnj/learnings/<topic>.md` (5-15 lines, concrete pattern + trigger + action + checks).
THEN append the new skill entry to `.tnj/index.json` with its trigger + keywords so JERRY can find it later. This is mandatory — a learning file not in the index is never read again.

**Option B — No pattern found:**
Set `learningsSkipped: true` with explicit reason in loop-state.json.

**There is no Option C. Skipping is not optional.**

Write `.tnj/loop-state.json`:
```json
{ "step": "TOM", "learningsWritten": ["<topic>"], "learningsSkipped": false }
// OR
{ "step": "TOM", "learningsSkipped": true, "learningsSkipReason": "<why no pattern>" }
```

Receipt: Either a learnings file exists in `.tnj/learnings/` OR `learningsSkipped: true` with non-empty reason.

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

**Required fields per step:**

| Step | Required Fields |
|------|----------------|
| TOM | `step`, `proposal`, `receipt` |
| LOOP-CHECK | `step` |
| JERRY | `step`, `opportunityCard` |
| IMPLEMENT | `step`, `proposal`, `receipt`, `opportunityCard` |
| TEACHER | `step`, `lastReceipt` — THEN Teacher produces: `learningsWritten` array OR `learningsSkipped: true` + `learningsSkipReason` |

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
    "path": "skills/name/SKILL.md",
    "type": "generic|custom"
  }]
}
```

## Skill Creation Rules

- Save only patterns that apply to 2+ future tasks.
- Be concise: 5-15 lines. Include trigger condition, checks, example.
- Learning file: .tnj/learnings/lowercase-hyphens.md
- Append entry to `.tnj/index.json` after writing.

## Anti-Traps

- Skipping Jerry without declaring LOOP-CHECK decision = violation.
- Running Jerry when scope is same = waste. Don't.
- Tom without Jerry = overbuilding. Always scan when scope expands.
- Jerry without Tom = analysis paralysis. Always implement after scanning.
- Receipt without a command = "it built" ≠ it works. Always run verification.
- Teacher with no output = violation. Always write learnings OR skip with explicit reason.
- Loop without state file write = state loss. Always write after every step.
