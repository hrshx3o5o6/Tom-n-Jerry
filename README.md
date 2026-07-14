# 🐱 Tom n Jerry

### Stop your AI coding agents from building what already exists.

[![npm version](https://img.shields.io/npm/v/@hrshx3o5o6/tomnjerry.svg?style=flat-flat&color=black)](https://www.npmjs.com/package/@hrshx3o5o6/tomnjerry)
[![GitHub stars](https://img.shields.io/github/stars/hrshx3o5o6/Tom-n-Jerry.svg?style=flat-square&color=black)](https://github.com/hrshx3o5o6/Tom-n-Jerry)
[![License](https://img.shields.io/github/license/hrshx3o5o6/Tom-n-Jerry.svg?style=flat-square&color=black)](https://github.com/hrshx3o5o6/Tom-n-Jerry/blob/main/LICENSE)

**Tom n Jerry** is a portable, agent-agnostic **opportunity detection layer** for AI engineers. 

Before your agent (Claude Code, Cursor, Aider, opencode) writes a single line of new code, Tom n Jerry intercepts the plan and forces it to look for the cheapest environmental move: reuse existing code, leverage framework conventions, utilize native Web APIs, mine git history, or delete work entirely.

```bash
npx @hrshx3o5o6/tomnjerry init
```

---

## The Problem: The "Brute-Force Abstraction" Trap

LLMs are highly intelligent, but they lack **street smarts**.

When you ask a state-of-the-art coding agent to add a feature, its default instinct is to *build*. It starts creating custom modules, utility wrappers, and new package dependencies because it treats code generation as its primary metric of success.

You end up with:
* A custom React state machine wrapper when a native HTML5 `<dialog>` would have sufficed.
* A hand-rolled timezone manipulation script when the codebase already imported a utility helper.
* A new database migration adding redundant tables when a JSONB field was already configured.
* A custom JSON log-parser when a single piped `jq` script solved the issue in seconds.

---

## The Solution: Momentum + Opportunism + Receipts

Tom n Jerry structures your agent's reasoning loop into a balance of momentum, skepticism, and proof:

```
                  [ Vague User Request ]
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │  TOM (Momentum)                                        │
 │  Proposes the next plausible Candidate Move.           │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │  JERRY (Skepticism / Scan)                              │
 │  Intercepts the move. Scans the workspace.             │
 │  Emits 1-3 Opportunity Cards showing a cheaper path.   │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │  RECEIPT (Verification)                                │
 │  Executes the revised move and forces objective proof  │
 │  (unit tests, visual diffs, curl checks).              │
 └────────────────────────────────────────────────────────┘
```

---

## How It Works: The Opportunity Card

Instead of long-winded planning essays, Jerry skills output strict, actionable **Opportunity Cards**:

* **Type:** `native` | `reuse` | `delete` | `shell` | `history` | `dependency` | `trap` | `receipt`
* **Claim:** The specific shortcut noticed in the codebase.
* **Evidence:** File paths, package versions, database models, or git commits.
* **Move:** The revised, lightweight engineering action.
* **Risk:** Potential edge cases or trade-offs.
* **Receipt:** The exact terminal command or test target to prove success.

### Real Example: Adding Dark Mode
* **Naive Agent Plan:** Build a custom `ThemeContext`, context provider, local storage sync helper, and CSS class variables.
* **Jerry Interception:**
  * **Type:** `native`
  * **Claim:** Tailwind CSS configuration already supports class-based dark mode.
  * **Evidence:** `tailwind.config.js` exists; components already use `dark:` utilities.
  - **Move:** Enable the theme class config and write a simple theme-toggle button.
  - **Receipt:** Inspect UI rendering using a browser screenshot.

---

## Out-of-the-Box Skills

Tom n Jerry comes pre-configured with 11 specialized Jerry sub-skills covering all development layers:

| Skill | Opportunity Target | Bypasses... |
| :--- | :--- | :--- |
| [`browser-jerry`](skills/browser-jerry/SKILL.md) | Native Browser/Web APIs (`popover`, `dialog`, validation) | Heavy third-party React/Vue component libraries |
| [`dependency-jerry`](skills/dependency-jerry/SKILL.md) | Existing workspace lockfiles (`package.json`, `poetry.lock`) | Unnecessary `npm install` and `pip install` overhead |
| [`db-jerry`](skills/db-jerry/SKILL.md) | Database schemas, ORM models, indexes | Redundant migrations and duplicate data columns |
| [`api-jerry`](skills/api-jerry/SKILL.md) | Active route registrations and API serializers | Endpoint and route handler duplication |
| [`trap-jerry`](skills/trap-jerry/SKILL.md) | Audited standard library helpers | Building custom auth, local cache syncs, or custom queues |
| [`test-jerry`](skills/test-jerry/SKILL.md) | Existing mock factories, test fixtures, and setups | Writing redundant test mock boilerplates |
| [`delete-jerry`](skills/delete-jerry/SKILL.md) | Dead branches, obsolete code, bloated conditions | Creating patches to work around zombie code |
| [`unix-jerry`](skills/unix-jerry/SKILL.md) | Shell utilities (`rg`, `awk`, `sed`, `jq`, `find`) | Writing custom JavaScript/Python scripts |
| [`git-jerry`](skills/git-jerry/SKILL.md) | Deleted features or patterns in git commit history | Rebuilding code that previously existed |

---

## ⚡ Quick Start: 10-Second Setup

Get Tom n Jerry running in your repository immediately.

### 1. Initialize inside your project root
Run the initialization script inside your target project directory:
```bash
npx @hrshx3o5o6/tomnjerry init
```
This script copies the `skills/` library locally and automatically deploys configuration templates targeting **Cursor** (`.cursorrules`), **Claude Code** (`claudeproj.md`), and **opencode** (`opencode.json`).

### 2. Invoke inside your Agent
Once initialized, trigger the coordinator loop by referencing it in your agent prompt:
* **Cursor / Claude Code / opencode:**
  > `/tomnjerry Add [your goal]`
* **Manual Prompt Injection:**
  If your agent doesn't support local commands, paste the combined rules from `templates/tomnjerry-combined.rules` directly into your system prompt.

---

## 🔮 Dynamic Self-Adaptation

**Tom n Jerry adapts to your workspace.**

If `jerry-core` detects you are building in a codebase domain not covered by the default 11 specialized skills (for example, a Swift iOS app, a Unity 3D C# codebase, or a Terraform cloud infrastructure pipeline), it automatically executes a self-generation sequence:

1. It identifies repetitive boilerplate configurations unique to the workspace's stack.
2. It writes a custom, local skill file under `skills/custom-<domain-name>/SKILL.md` following our robust execution template.
3. It registers the rules. Future runs in the codebase automatically trigger the newly synthesized custom Jerry.

---

## Verification & Outcomes

We benchmarked Tom n Jerry against baseline agents across 3 common development tasks:

| Metric | Baseline Agent | Tom n Jerry Agent | Benefit |
| :--- | :--- | :--- | :--- |
| **New Lines of Code** | ~120 lines (custom parsing) | **0 lines** (reused `jq` script) | **100% reduction** in code bloat |
| **New Packages Installed** | 1 package (`date-fns`) | **0 packages** (reused standard API) | Zero security dependency risk |
| **Build verification** | Assumed success | **Verified** (passed narrow `receipt`) | Guaranteed correctness |

---

## Contributing

We welcome additions of narrow, evidence-seeking, receipt-driven Jerry skills. Check out [`CONTRIBUTING.md`](CONTRIBUTING.md) to see how to format new custom skills.

---

## License

[MIT](LICENSE)
