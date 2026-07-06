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

1. Copy the relevant `skills/*/SKILL.md` files into your agent's skill, rule, command, or instruction system.
2. Invoke `tom-core` when the task needs a concrete next move.
3. Invoke `jerry-core` before implementation to produce opportunity cards.
4. Invoke specialized Jerry skills when a card points to a narrower affordance.
5. Invoke `receipt-jerry` after action to prove the result.

## Agent Compatibility

These skills are designed to be adapted into Codex, Claude Code, opencode, Cursor, Aider, and other agent harnesses.

## Non-Goals For v0

- No runtime orchestrator.
- No CLI installer.
- No agent-specific package format.
- No benchmark suite.

The first version is deliberately simple: readable Markdown skills that can travel across tools.
