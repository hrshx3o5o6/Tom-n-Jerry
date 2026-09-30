---
name: delete-jerry
description: "The best code is no code. Solve problems by subtracting. Use: Before editing existing code. When cleaning up tech debt. When fixing bugs in legacy abstractions. When asked to migrate, cleanup, refactor, or simplify."
---

# delete-jerry

The best code is no code. Solve problems by subtracting.

## Trigger
Before editing existing code. When cleaning up tech debt. When fixing bugs in legacy abstractions. When asked to migrate, cleanup, refactor, or simplify.

## Checks
1. Search for callers: `rg` the target. Zero callers = delete candidate.
2. Check if a class/interface has only one implementation → collapse to direct calls.
3. Check conditional branches: can obsolete `if/else` paths be removed?
4. Check for redundant config files, backup files, duplicate variables.

## Action
- Zero callers → delete. Do NOT patch.
- Single-implementation interface → collapse.
- Obsolete conditional → remove the dead branch.

## Anti-Traps
- Never delete DB schemas, production code, or user data without confirmation.
- Do not delete code still in progress or designed for upcoming features.
- When deleting a module: remove dangling imports, broken types, orphaned files too.
