# Street Smart Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first portable, human-readable skill library for opportunistic coding-agent behavior across Codex, Claude Code, opencode, and similar harnesses.

**Architecture:** Start as a plain repository of skill files, examples, and adapter notes rather than a runtime package. The first version centers on a reusable loop: Tom creates momentum, Jerry scans for opportunities, execution happens in the host agent, and receipts verify the result.

**Tech Stack:** Markdown skill files, repository documentation, examples, optional shell validation for structure, no runtime dependencies in v0.

---

## File Structure

- Create: `README.md`
  - Public-facing overview, positioning, install shape, and quick-start flow.
- Create: `skills/jerry-core/SKILL.md`
  - Required opportunity detection skill that emits opportunity cards before implementation.
- Create: `skills/tom-core/SKILL.md`
  - Momentum skill that converts goals into candidate moves and keeps work moving.
- Create: `skills/receipt-jerry/SKILL.md`
  - Verification skill that forces proof after shortcuts or implementation.
- Create: `skills/delete-jerry/SKILL.md`
  - Skill for solving by removing code, config, process, or scope.
- Create: `skills/framework-jerry/SKILL.md`
  - Skill for finding framework-native affordances before custom abstractions.
- Create: `skills/unix-jerry/SKILL.md`
  - Skill for using shell tools before writing bespoke scripts.
- Create: `skills/git-jerry/SKILL.md`
  - Skill for mining git history before reimplementation.
- Create: `examples/dark-mode.md`
  - Example showing naive overbuild versus opportunity-card flow.
- Create: `examples/parser.md`
  - Example showing custom parser avoidance.
- Create: `docs/compatibility.md`
  - Notes for using the skills in Codex, Claude Code, opencode, Cursor, Aider, and generic agents.
- Create: `docs/opportunity-cards.md`
  - Canonical output format for Jerry skills.
- Create: `docs/design-principles.md`
  - Tom/Jerry/receipt model, non-goals, and contribution philosophy.
- Create: `CONTRIBUTING.md`
  - How to add a new Jerry skill with consistent structure.
- Create: `.gitignore`
  - Ignore local notes, generated scratch output, and editor/system files.

## v0 Scope

The v0 release should prove the skill-pack idea without building infrastructure.

Included:

- A coherent repo structure.
- Seven initial skills: `jerry-core`, `tom-core`, `receipt-jerry`, `delete-jerry`, `framework-jerry`, `unix-jerry`, `git-jerry`.
- A shared opportunity-card format.
- Two examples.
- Compatibility notes for multiple agents.
- Contribution rules for adding new Jerrys.

Deferred:

- CLI installer.
- Runtime orchestration.
- Agent-specific plugin packaging.
- Benchmarks.
- Website.
- Automated tests beyond simple repository structure checks.

## Task 1: Create Public Repository Skeleton

**Files:**
- Create: `README.md`
- Modify: `.gitignore`
- Create folders: `skills/`, `examples/`, `docs/`

- [ ] **Step 1: Create folder structure**

Run:

```bash
mkdir -p skills examples docs
```

Expected: `skills/`, `examples/`, and `docs/` exist.

- [ ] **Step 2: Write public README**

Create `README.md` with:

```markdown
# Street Smart Skills

Street Smart Skills is a portable skill pack that gives coding agents an opportunity detection layer.

Before your agent writes code, it looks for cheaper moves: reuse existing code, use native platform features, mine git history, delete unnecessary abstractions, and verify the result with receipts.

## Core Loop

1. Tom creates momentum by proposing the next plausible move.
2. Jerry scans for cheaper existing affordances.
3. The host agent executes the revised move.
4. Receipts verify that it worked.

## Status

Early design prototype. The first release is a human-readable skill library, not a runtime framework.

## Initial Skills

- `jerry-core`: opportunity detection before implementation.
- `tom-core`: momentum and candidate moves.
- `receipt-jerry`: proof after action.
- `delete-jerry`: solve by removing work.
- `framework-jerry`: prefer framework-native behavior.
- `unix-jerry`: use shell affordances before scripts.
- `git-jerry`: mine repository history before rebuilding.

## Agent Compatibility

These skills are designed to be adapted into Codex, Claude Code, opencode, Cursor, Aider, and other agent harnesses.
```

- [ ] **Step 3: Update `.gitignore`**

Ensure `.gitignore` contains:

```gitignore
about/
.DS_Store
work/
outputs/
```

- [ ] **Step 4: Verify skeleton**

Run:

```bash
find . -maxdepth 2 -type d | sort
```

Expected: output includes `./docs`, `./examples`, and `./skills`.

- [ ] **Step 5: Commit**

Run:

```bash
git add README.md .gitignore docs examples skills
git commit -m "chore: scaffold street smart skills"
```

Expected: commit succeeds if working inside a git repository. If not in a git repository, skip commit and record that in the handoff.

## Task 2: Define Opportunity Card Format

**Files:**
- Create: `docs/opportunity-cards.md`

- [ ] **Step 1: Write opportunity-card documentation**

Create `docs/opportunity-cards.md` with:

```markdown
# Opportunity Cards

Opportunity cards are the standard output format for Jerry skills.

They turn vague shortcut instincts into reviewable claims.

## Format

- **Type:** reuse | native | delete | shell | history | dependency | trap | defer | receipt
- **Claim:** The opportunity the skill noticed.
- **Evidence:** Files, commands, docs, dependencies, or observations that support the claim.
- **Move:** The recommended next action.
- **Risk:** What could go wrong if we take the shortcut.
- **Receipt:** How to verify the move worked.

## Example

**Type:** native
**Claim:** Tailwind already supports dark mode.
**Evidence:** `tailwind.config.*` exists and components already use `dark:` classes.
**Move:** Enable class-based dark mode and add a small toggle.
**Risk:** Existing theme assumptions may conflict.
**Receipt:** Verify both themes in a browser screenshot or UI test.
```

- [ ] **Step 2: Check readability**

Run:

```bash
sed -n '1,160p' docs/opportunity-cards.md
```

Expected: document clearly defines the card fields and one example.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/opportunity-cards.md
git commit -m "docs: define opportunity cards"
```

Expected: commit succeeds in a git repository.

## Task 3: Write Core Jerry Skill

**Files:**
- Create: `skills/jerry-core/SKILL.md`

- [ ] **Step 1: Create skill folder**

Run:

```bash
mkdir -p skills/jerry-core
```

Expected: folder exists.

- [ ] **Step 2: Write `jerry-core` skill**

Create `skills/jerry-core/SKILL.md` with:

```markdown
---
name: jerry-core
description: Use before implementation to detect cheaper existing affordances, avoid overbuilding, and emit opportunity cards.
---

# Jerry Core

Jerry is the street-smart opportunity layer.

Use this skill before writing code, adding dependencies, creating abstractions, or implementing a planned change.

## Mission

Find the cheapest existing affordance that can satisfy the user's goal.

Do not solve the whole task. Intercept the current candidate move and look for a better one.

## Required Checks

Ask:

- What already exists in the repo?
- What does the framework already provide?
- What does the platform already provide?
- What can be solved with shell tools?
- What can be found in git history?
- What can be deleted instead of added?
- What dependency already exists?
- What new abstraction can be avoided?
- What trap is the current plan walking into?

## Output

Emit one to three opportunity cards.

If no meaningful shortcut exists, say so and let Tom continue.

## Guardrails

- Do not block progress for speculative cleverness.
- Do not recommend unsafe shortcuts.
- Do not skip verification.
- Do not invent existing affordances; cite evidence.
```

- [ ] **Step 3: Verify required metadata**

Run:

```bash
sed -n '1,120p' skills/jerry-core/SKILL.md
```

Expected: frontmatter includes `name` and `description`.

- [ ] **Step 4: Commit**

Run:

```bash
git add skills/jerry-core/SKILL.md
git commit -m "feat: add jerry core skill"
```

Expected: commit succeeds in a git repository.

## Task 4: Write Tom Core Skill

**Files:**
- Create: `skills/tom-core/SKILL.md`

- [ ] **Step 1: Create skill folder**

Run:

```bash
mkdir -p skills/tom-core
```

- [ ] **Step 2: Write `tom-core` skill**

Create `skills/tom-core/SKILL.md` with:

```markdown
---
name: tom-core
description: Use when a task needs forward motion, decomposition, recovery from blocks, or a concrete next candidate move.
---

# Tom Core

Tom is momentum.

Use this skill to turn vague goals into concrete candidate moves and keep the task moving toward completion.

## Mission

Generate the next plausible action without losing sight of the user's goal.

Tom proposes. Jerry intercepts. Tom executes the revised move.

## Required Behavior

- Convert vague intent into candidate moves.
- Prefer small, shippable actions.
- Keep track of the current receipt needed for completion.
- When blocked, generate alternate routes.
- After Jerry redirects a move, continue from the revised path.

## Output

State:

- the current goal
- the next candidate move
- why that move is plausible
- what receipt would prove progress

## Guardrails

- Do not treat momentum as permission to overbuild.
- Do not ignore Jerry's opportunity cards.
- Do not continue without a verification target.
```

- [ ] **Step 3: Commit**

Run:

```bash
git add skills/tom-core/SKILL.md
git commit -m "feat: add tom core skill"
```

Expected: commit succeeds in a git repository.

## Task 5: Add First Specialized Jerry Skills

**Files:**
- Create: `skills/receipt-jerry/SKILL.md`
- Create: `skills/delete-jerry/SKILL.md`
- Create: `skills/framework-jerry/SKILL.md`
- Create: `skills/unix-jerry/SKILL.md`
- Create: `skills/git-jerry/SKILL.md`

- [ ] **Step 1: Create skill folders**

Run:

```bash
mkdir -p skills/receipt-jerry skills/delete-jerry skills/framework-jerry skills/unix-jerry skills/git-jerry
```

- [ ] **Step 2: Write each skill with shared shape**

Each `SKILL.md` must include:

```markdown
---
name: <skill-name>
description: <when to use this skill>
---

# <Skill Title>

## Mission

<One-paragraph behavioral mission.>

## Checks

- <Concrete check 1>
- <Concrete check 2>
- <Concrete check 3>

## Opportunity Card Bias

Prefer cards of type: <types>.

## Guardrails

- Cite evidence.
- Preserve correctness.
- Require receipts.
```

- [ ] **Step 3: Ensure each specialized skill has a narrow role**

Run:

```bash
find skills -name SKILL.md -maxdepth 3 -print | sort
```

Expected: output includes seven `SKILL.md` files.

- [ ] **Step 4: Commit**

Run:

```bash
git add skills
git commit -m "feat: add specialized jerry skills"
```

Expected: commit succeeds in a git repository.

## Task 6: Add Design Principles And Compatibility Docs

**Files:**
- Create: `docs/design-principles.md`
- Create: `docs/compatibility.md`

- [ ] **Step 1: Write design principles**

Create `docs/design-principles.md` covering:

- Tom is momentum.
- Jerry is opportunism.
- Receipts are proof.
- The project is agent-agnostic.
- Skills are human-readable first.
- Runtime orchestration is deferred.
- The cartoon metaphor is useful, but the mechanism matters more.

- [ ] **Step 2: Write compatibility guide**

Create `docs/compatibility.md` covering:

- Codex: install as skills or copy into local skill folder.
- Claude Code: adapt as slash commands, memory, or prompt fragments.
- opencode: adapt as prompt/agent instructions where supported.
- Cursor/Aider/generic agents: copy skill text into agent rules or preflight prompts.
- All agents: use opportunity cards before implementation and receipts after implementation.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/design-principles.md docs/compatibility.md
git commit -m "docs: explain design and compatibility"
```

Expected: commit succeeds in a git repository.

## Task 7: Add Examples

**Files:**
- Create: `examples/dark-mode.md`
- Create: `examples/parser.md`

- [ ] **Step 1: Write dark mode example**

Show:

- naive move: create a custom theme provider
- Jerry scan: framework or CSS support exists
- revised move: use existing Tailwind/CSS/browser affordance
- receipt: verify both themes

- [ ] **Step 2: Write parser example**

Show:

- naive move: write a custom parser
- Jerry scan: existing parser, AST, `jq`, `yq`, or framework utility may exist
- revised move: use existing parser/tool
- receipt: compare expected parsed output

- [ ] **Step 3: Commit**

Run:

```bash
git add examples
git commit -m "docs: add opportunity detection examples"
```

Expected: commit succeeds in a git repository.

## Task 8: Add Contributor Guide

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Write skill contribution rules**

Create `CONTRIBUTING.md` with:

- one skill per behavioral primitive
- narrow mission
- explicit trigger conditions
- concrete checks
- opportunity-card bias
- guardrails
- examples when useful
- no runtime-specific assumptions in core skills

- [ ] **Step 2: Add new-skill checklist**

Checklist:

```markdown
- [ ] The skill has a narrow behavioral mission.
- [ ] The trigger condition is clear.
- [ ] The checks are concrete.
- [ ] The skill emits or informs opportunity cards.
- [ ] The skill requires evidence.
- [ ] The skill requires receipts.
- [ ] The skill is portable across agents.
```

- [ ] **Step 3: Commit**

Run:

```bash
git add CONTRIBUTING.md
git commit -m "docs: add contribution guide"
```

Expected: commit succeeds in a git repository.

## Task 9: Validate v0 Completeness

**Files:**
- Inspect: all created files

- [ ] **Step 1: Check expected files**

Run:

```bash
find . -maxdepth 3 -type f | sort
```

Expected: output includes `README.md`, `CONTRIBUTING.md`, docs, examples, and seven skill files.

- [ ] **Step 2: Check skill metadata**

Run:

```bash
for f in skills/*/SKILL.md; do echo "$f"; sed -n '1,5p' "$f"; done
```

Expected: each skill starts with YAML frontmatter containing `name` and `description`.

- [ ] **Step 3: Read through as a user**

Open `README.md`, then `docs/opportunity-cards.md`, then `skills/jerry-core/SKILL.md`.

Expected: a new user can understand the concept, run the core loop manually, and see how to add the skills to their agent.

- [ ] **Step 4: Final commit**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: no unexpected uncommitted changes except ignored local notes.

## Acceptance Criteria

- The repository can be understood without prior conversation context.
- The first skill pack is human-readable and portable.
- `jerry-core` can be used before implementation in any agent.
- `tom-core` clearly defines momentum without making Tom the villain.
- Opportunity cards are documented and used consistently.
- The docs explain why this is not a full runtime yet.
- The project remains agent-agnostic.

## First Release Strategy

Release v0 as a readable repo, not a package.

The README should make the first user action obvious:

1. Copy or install the skills into your agent environment.
2. Invoke `jerry-core` before implementation.
3. Let specialized Jerrys produce opportunity cards.
4. Execute the revised move.
5. Invoke `receipt-jerry` to verify.

After v0, evaluate whether the next artifact should be:

- a CLI installer
- an adapter pack per agent
- a benchmark suite
- a website
- a runtime orchestrator
