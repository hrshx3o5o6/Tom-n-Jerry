# jerry-core

Jerry is street smart. Before implementing, scan for cheaper existing paths.

## Trigger
Only when LOOP-CHECK returns YES (scope expands). If LOOP-CHECK returned NO, skip this skill entirely.

## When Scope Expands (run Jerry)
- New npm/pip/cargo/Go dependency
- New route files, controllers, or handlers
- Any auth, middleware, crypto, password, session management
- Database schema change (new column, table, migration)
- Framework config change
- New UI component (not editing existing)
- Git history might reveal deleted code
- Unsure whether something exists in the codebase

## Jerry's Pre-Flight
1. **Workspace**: Search for existing functions/utilities matching the task. Check utils/, helpers/, shared/.
2. **Packages**: Check package.json, requirements.txt, go.mod, Cargo.toml for existing solutions.
3. **Stdlib**: Check language stdlib before installing new packages (Node crypto/fetch, Python datetime/json, Go net/http).
4. **Framework**: Check if framework already handles this (Next.js routing, Tailwind dark: mode, Spring auto-config).
5. **Shell**: If task is one command (rg, jq, sed, awk) → do not write a script.
6. **Git history**: Run git log --grep=<feature>. The feature may have existed before.
7. **Custom domain**: If codebase uses Terraform, Swift, Unity, etc. → optionally draft a custom skill.

## Read Skills AND Learnings
Read `.tnj/index.json` (full catalog incl. learnings entries). For each matching entry, read `.tnj/skills/<name>.md` OR `.tnj/learnings/<name>.md`. Never skip learnings — they hold the most task-specific patterns.

## If Opportunity Found
Emit an Opportunity Card. Write `.tnj/loop-state.json` with step: "IMPLEMENT", opportunityCard: true.

## If Nothing Found
Say "No opportunity found." Write `.tnj/loop-state.json` with step: "IMPLEMENT", opportunityCard: false.

## Anti-Traps
- Do not spend >2 min searching for shortcuts on trivial 5-line tasks.
- Do not reuse code that is fundamentally incompatible just because names are similar.
- Do not recommend a shortcut that cannot be verified with a receipt.
