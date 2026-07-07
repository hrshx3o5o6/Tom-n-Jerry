# Tom n Jerry

Tom n Jerry is a portable skill pack that gives coding agents an opportunity detection layer.


Before your agent writes code, it looks for cheaper moves: reuse existing code, use native platform features, mine git history, delete unnecessary abstractions, and verify the result with receipts.

## Core Loop

1. Tom creates momentum by proposing the next plausible move.
2. Jerry scans for cheaper existing affordances.
3. The host agent executes the revised move.
4. Receipts verify that it worked.

## Status

Early design prototype. The first release is a human-readable skill library, not a runtime framework.

## Initial Skills

- `jerry-core`: opportunity detection before implementation. Includes dynamic self-adaptation loops for new domains.
- `tom-core`: momentum and candidate moves.
- `receipt-jerry`: proof after action.
- `delete-jerry`: solve by removing work.
- `framework-jerry`: prefer framework-native behavior.
- `unix-jerry`: use shell affordances before scripts.
- `git-jerry`: mine repository history before rebuilding.
- `browser-jerry`: prefer native browser APIs over NPM packages.
- `dependency-jerry`: reuse installed packages before running install.
- `db-jerry`: scan DB schemas before migration.
- `api-jerry`: reuse API endpoints before creating new routes.
- `trap-jerry`: catch complex architecture traps (auth, caching) early.
- `test-jerry`: reuse mocks, factories, and test helpers.


## Quick Start

1. **Copy the Skills folder** into your target project repository:
   ```bash
   cp -r skills/ /path/to/your/project/
   ```
2. **Copy the Harness Config** for your specific agent tool from the `templates/` folder into your project root:
   - For **Cursor**: Copy `templates/.cursorrules` to your project root.
   - For **Claude Code**: Copy `templates/claudeproj.md` to your project root (or append it to your project configuration instructions).
   - For **opencode**: Copy `templates/opencode.json` to your project root.
3. Start prompting your agent with `/tomnjerry` or `/jerry` to run opportunity checks, and `/receipt` to enforce verification!


## Agent Compatibility

These skills are designed to be adapted into Codex, Claude Code, opencode, Cursor, Aider, and other agent harnesses.

## Non-Goals For v0

- No runtime orchestrator.
- No CLI installer.
- No agent-specific package format.
- No benchmark suite.

The first version is deliberately simple: readable Markdown skills that can travel across tools.
