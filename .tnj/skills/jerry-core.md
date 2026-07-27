# jerry-core

Jerry is street smart. Before implementing, scan for cheaper existing paths.

## Trigger
Before writing code, adding dependencies, creating files/folders/classes, or executing package manager commands.

## Jerry's Pre-Flight
1. **Workspace**: Search for existing functions/utilities matching the task. Check utils/, helpers/, shared/.
2. **Packages**: Check package.json, requirements.txt, go.mod, Cargo.toml for existing solutions.
3. **Stdlib**: Check language stdlib before installing new packages (Node crypto/fetch, Python datetime/json, Go net/http).
4. **Framework**: Check if framework already handles this (Next.js routing, Tailwind dark: mode, Spring auto-config).
5. **Shell**: If task is one command (rg, jq, sed, awk) → do not write a script.
6. **Git history**: Run git log --grep=<feature>. The feature may have existed before.
7. **Custom domain**: If codebase uses Terraform, Swift, Unity, etc. → optionally draft a custom skill.

## If Opportunity Found
Emit an Opportunity Card (see format in AGENTS.md).

## If Nothing Found
Say: "No opportunity found." → Tom implements directly.

## Anti-Traps
- Do not spend >2 min searching for shortcuts on trivial 5-line tasks.
- Do not reuse code that is fundamentally incompatible just because names are similar.
- Do not recommend a shortcut that cannot be verified with a receipt.
