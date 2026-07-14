# 🐱 Tom n Jerry

### Tom writes 300 lines of code. Jerry intercepts him, deletes it, and uses a single native platform line. It works.

[![npm version](https://img.shields.io/npm/v/@hrshx3o5o6/tomnjerry.svg?style=flat-flat&color=black)](https://www.npmjs.com/package/@hrshx3o5o6/tomnjerry)
[![GitHub stars](https://img.shields.io/github/stars/hrshx3o5o6/Tom-n-Jerry.svg?style=flat-square&color=black)](https://github.com/hrshx3o5o6/Tom-n-Jerry)

**Tom n Jerry** is a portable, agent-agnostic **opportunity detection layer** for your AI coding agents (Claude Code, Cursor, Aider, opencode). 

It stops your agent from brute-forcing code abstractions and forces it to behave like a lazy, street-smart senior developer.

```bash
npx @hrshx3o5o6/tomnjerry init
```

---

## The Analogy

### 🐱 Tom: The Eager Junior
Tom is your AI coding agent's default planning mode. Eager to please, highly energetic, and completely devoid of street smarts. 

When you ask Tom to add a simple feature, he immediately starts:
* Designing custom React state managers.
* Writing bespoke timezone parsers.
* Adding new, unverified npm dependencies.
* Creating complex helper wrappers.

Tom thinks writing more code makes him look smart.

### 🐭 Jerry: The Street-Smart Mouse
Jerry is the intervention layer. He intercepts Tom's massive 300-line implementation plan, looks at the environment, and finds the cheap shortcut.

Jerry points to:
* The native browser API that already does it.
* The utility library already installed in your lockfile.
* The single-line database field already configured.
* The git commit that deleted this exact feature three weeks ago.

Jerry deletes Tom's work, writes one line, and runs a test to prove it works.

---

## How It Works: The Loop

```
[User Request] ─► 🐱 Tom plans 300 LOC ─► 🐭 Jerry intercepts ─► [One-Line Move] ─► 🧾 Receipt verifies
```

Whenever you ask your agent to build something, Jerry intercepts the plan and outputs an **Opportunity Card**:

* **Type:** `native`
* **Claim:** Tailwind already supports class-based dark mode.
* **Evidence:** `tailwind.config.js` exists and contains dark theme variables.
* **Move:** Delete the custom Context Provider. Use the existing classes.
* **Receipt:** `npm run build && verify-screenshot`

---

## ⚡ Quick Start: 10-Second Setup

Get Tom n Jerry running in your repository immediately.

### 1. Initialize inside your project root
```bash
npx @hrshx3o5o6/tomnjerry init
```
This copies the `skills/` library locally and deploys config files for **Cursor** (`.cursorrules`), **Claude Code** (`claudeproj.md`), and **opencode** (`opencode.json`).

### 2. Invoke inside your Agent
Once initialized, trigger the coordinator loop by referencing it in your agent prompt:
* **Cursor / Claude Code / opencode:**
  > `/tomnjerry Add [your goal]`
* **Manual Prompt:**
  If your agent doesn't support local commands, paste the combined rules from `templates/tomnjerry-combined.rules` directly into your system prompt.

---

## The Skills in the Box

Tom n Jerry comes pre-configured with specialized Jerry sub-skills:

* [**`browser-jerry`**](skills/browser-jerry/SKILL.md) — Uses native Web APIs (`popover`, `dialog`) instead of adding heavy JS libraries.
* [**`dependency-jerry`**](skills/dependency-jerry/SKILL.md) — Scans lockfiles to reuse packages instead of running new installs.
* [**`db-jerry`**](skills/db-jerry/SKILL.md) — Checks active database schemas to prevent duplicate fields and tables.
* [**`api-jerry`**](skills/api-jerry/SKILL.md) — Reuses route serializers instead of bloating endpoints.
* [**`delete-jerry`**](skills/delete-jerry/SKILL.md) — Solves bugs by deleting zombie code instead of writing patches.
* [**`unix-jerry`**](skills/unix-jerry/SKILL.md) — Uses a single shell command instead of custom Node/Python scripts.
* [**`git-jerry`**](skills/git-jerry/SKILL.md) — Restores previously deleted features from commit logs instead of rebuilding.
* [**`trap-jerry`**](skills/trap-jerry/SKILL.md) — Identifies complex traps (custom auth, caches) and redirects to standard libraries.

---

## Contributing

Add a new Jerry skill only when it represents a distinct, street-smart behavioral shortcut. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
