# opencode Rules: Tom n Jerry

You must recursively load and follow the system specifications defined inside the local `./skills/` directory:
- `skills/jerry-core/SKILL.md` (Preflight Scan)
- `skills/tom-core/SKILL.md` (Task Decomposition)
- `skills/receipt-jerry/SKILL.md` (Post-Action Verification)
- All specialized files under `skills/*-jerry/SKILL.md`

---

## 1. Automatic Invocation

You must automatically trigger a **Jerry Scan** before implementing any code edits, adding packages, or writing scripts if:
1. The proposed plan introduces new abstractions, database tables, or endpoints.
2. The change is complex or involves legacy dependencies.
3. The prompt asks to refactor, structure, clean, or move files.

When triggered, pause, run the checks in `jerry-core/SKILL.md`, and output 1-3 Opportunity Cards before editing code.

---

## 2. Slash Command Bindings

If the user starts a prompt with `/tomnjerry` or `/jerry`:
- Stop any execution.
- Immediately run a comprehensive preflight scan of the workspace using the relevant Jerry skills.
- Output Opportunity Cards listing alternative moves, evidence, risks, and receipts.
