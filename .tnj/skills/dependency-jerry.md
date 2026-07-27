# dependency-jerry

Before installing any package, check what's already installed.

## Trigger
Before running npm install, pip install, cargo add, gem install. Before building utility helpers (date formatting, deep copy, HTTP wrappers).

## Checks
1. Check lockfiles: package.json, requirements.txt, go.mod, Cargo.toml — does the solution already exist?
2. Check stdlib: Node crypto/fetch, Python datetime/json, Go standard lib — can stdlib solve this?
3. Check utils/: internal helpers already written by teammates.

## Action
- Package exists → use it. Do NOT reinstall.
- Stdlib covers it → use stdlib. Do NOT install.
- Truly needed → install with correct flag (--save-prod, --save-dev, etc.).

## Anti-Traps
- Micro-dependency: installing a package for a 3-line utility. Write it inline or use an existing core package if already installed.
- Multiple versions: installing a package that's already a transitive dep under a different name.
