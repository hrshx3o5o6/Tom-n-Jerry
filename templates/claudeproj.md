# Claude Project Instructions for Tom n Jerry

These instructions bind **Tom n Jerry** behavior to Claude Code slash commands and planning loops in this project directory.

---

## 1. Slash Command Mappings

When any of the following slash patterns are invoked, execute their matching behavior:

### `/tomnjerry` or `/jerry`
1. Load and execute the rules in `skills/jerry-core/SKILL.md`.
2. Inspect the current workspace directories, lockfiles, database schemas, and git logs.
3. Emit 1 to 3 **Opportunity Cards** outlining existing code/platform shortcuts.
4. Stop and propose the revised move.

### `/tom`
1. Load `skills/tom-core/SKILL.md`.
2. Break down the current task into 3-5 small, shippable moves and identify the immediate candidate move.

### `/receipt`
1. Load `skills/receipt-jerry/SKILL.md`.
2. Execute a concrete command-line test, curl check, or git diff validation.
3. Render the raw CLI output proving implementation success.

---

## 2. Preflight Behavior Loop

Even without an explicit command, before executing any code modifications:
- Run a quick preflight check: Does the repository or framework already have an abstraction, library, or route that satisfies this goal? (Refer to `skills/framework-jerry`, `skills/dependency-jerry`, etc.).
- Propose subtraction (`delete-jerry`) or shell commands (`unix-jerry`) before writing new scripts or classes.
