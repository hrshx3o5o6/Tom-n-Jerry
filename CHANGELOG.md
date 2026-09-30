# Changelog

## 3.0.0 (unreleased)

The loop now runs on real lifecycle hooks instead of an instruction block the model could ignore.

- **Seven harnesses:** Claude Code, Codex CLI, Hermes Agent, opencode, Pi, Gemini CLI and Antigravity.
- **`tomnjerry setup`** detects your harnesses and merges TNJ into their configs. It is idempotent, keeps backups, never touches your own hooks, and enables the current project.
- **`tomnjerry remove`** restores configs to their pre-setup state.
- **`tomnjerry doctor`** runs every installed hook against a scratch project.
- **`tomnjerry stats`** shows what Jerry, Receipt and Teacher did in the project.
- **Jerry is deterministic:** it checks install commands for 12 package managers against your manifests and lockfiles, and suggests native alternatives. The new `mode` setting is `advise` (default), `enforce` or `off`.
- **Receipts come from real tool output.** If code changed without being verified, the agent is sent back once.
- **Teacher has a deterministic trigger:** at most one nudge per session.
- **Plugin listings:** Claude Code marketplace, a Codex plugin, the Pi package manifest, and an opencode npm plugin.
- **Breaking:** skills moved to `tnj/skills/<id>/SKILL.md` (agentskills.io format), and `index.json` paths changed to match. Running `init` or `setup` again migrates a project and keeps its registered learnings.
- **Fixes:**
  - `init` no longer overwrites `index.json`.
  - The CLI no longer crashes when `HOME` is unset.

## 1.0.0 (2026-07-21)

- Initial release
- 14 skill files (Tom core + 13 Jerry scanners)
- Zero-dependency Node.js CLI (`npx @hrshx3o5o6/tomnjerry init`)
- Agent harness templates for Cursor, Claude Code, opencode
