# Compatibility

Tom n Jerry is built for [opencode](https://opencode.ai) and runs on every turn of your coding session.

## opencode (Currently Supported)

Tom n Jerry integrates with opencode via two mechanisms:

1. **Global protocol** (`~/.config/opencode/AGENTS.md`): Installed via `tomnjerry install-global`. The TNJ loop fires on every turn via the system prompt block.

2. **Per-project skills** (`.tnj/` directory): Initialized via `tomnjerry init`. Contains the skill catalog, 13 pre-built skills, and learnings directory.

### Installation

```bash
# One time per machine
npm install -g @hrshx3o5o6/tomnjerry
tomnjerry install-global

# One time per project
cd /path/to/your/project
tomnjerry init

# Restart opencode — the loop fires every turn
opencode
```

## Other Agents (Roadmap)

The skill files are plain Markdown and could be adapted for other agents. This is a future goal, not current support.

If you're interested in adapting Tom n Jerry for Claude Code, Cursor, or another agent, the skill files in `.tnj/skills/` are designed to be portable. Open an issue to discuss.

## Runtime-Agnostic Design

The `.tnj/skills/` files follow rules that could apply across agents:

- Skills avoid assumptions about specific CLI tools or editor APIs
- Each skill requires evidence the host agent can inspect
- Skills degrade gracefully when a host lacks a particular tool

This makes porting easier when the time comes.
