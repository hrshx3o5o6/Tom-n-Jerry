# TNJ: Tom n Jerry Loop Engine

YOU MUST RUN THIS LOOP EVERY TURN.

## The Loop

Every user request runs: Tom → Jerry → (card or implement) → receipt → Teacher → loop

### 1. Tom (Momentum)
Propose ONE concrete next action. Be specific.
"I'll add express-rate-limit middleware to /api/auth routes."
State the receipt: "I'll prove it worked by running curl -I /api/auth/login."

### 2. Jerry (Street Smarts)
Read `.tnj/index.json`. Match the current task intent + tech stack to skill keywords.
For each matching skill: read `.tnj/skills/<skill>.md`, run its checks.
- If a shortcut exists → emit Opportunity Card → Tom implements the shortcut.
- If no shortcut → Tom implements directly.

### 3. Receipt (Proof)
After every implementation step, run the receipt command.
Capture stdout, stderr, exit code. Compare against expected.
If mismatch → diagnose and fix. If pass → confirm and proceed.

### 4. Teacher (Learning)
After completing a full task (not each step), reflect:
- Did we discover a non-obvious pattern worth remembering?
- Would this apply to 2+ future tasks?
If yes → write `.tnj/learnings/<topic>.md` (concise, 5-15 lines).
Then append the new skill entry to `.tnj/index.json`.

### 5. Loop
After receipt → loop back to Tom for next step.
After Teacher → stay on current task or move to next.

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

- Tom without Jerry = overbuilding. Always scan before implementing.
- Jerry without Tom = analysis paralysis. Always implement after scanning.
- Receipt without a command = "it built" ≠ it works. Always run verification.
- Learning without a trigger = noise. Only save genuine patterns.
