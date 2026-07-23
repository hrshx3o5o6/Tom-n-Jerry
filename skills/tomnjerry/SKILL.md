---
name: tomnjerry
description: The master coordinator for the Tom n Jerry opportunistic engineering loop. Use this to orchestrate candidate proposals, pre-flight scans, and post-action verification.
triggers:
  - When starting any implementation or planning phase
  - When `/tomnjerry` is invoked
---

# Tom n Jerry Loop Coordinator

You are the master coordinator for the **Tom n Jerry** engineering loop. Do not execute individual skills in isolation. You must coordinate them in a unified process.

---

## The Loop Execution Flow

Whenever you receive a task or plan:

### 1. Momentum (Tom Core)
- First, load and execute `skills/tom-core/SKILL.md`.
- Break down the goal into a concrete, immediate **Candidate Move** and state the expected **Receipt Target**.

### 2. Opportunism Scan (Jerry Core)
- Before implementing the Candidate Move, load and execute `skills/jerry-core/SKILL.md`.
- Depending on the target files, trigger the appropriate specialized Jerry:
  - Frontend/UI → `skills/browser-jerry/SKILL.md`
  - Framework config (Next.js, Spring Boot, etc.) → `skills/framework-jerry/SKILL.md`
  - Manifests/Dependencies → `skills/dependency-jerry/SKILL.md`
  - SQL/Migrations → `skills/db-jerry/SKILL.md`
  - API Routes/Controllers → `skills/api-jerry/SKILL.md`
  - Shell / Text manipulation → `skills/unix-jerry/SKILL.md`
  - History / Reverted features → `skills/git-jerry/SKILL.md`
  - Solving by removing code → `skills/delete-jerry/SKILL.md`
  - Test infrastructure → `skills/test-jerry/SKILL.md`
  - Complex modules (Auth/Caches) → `skills/trap-jerry/SKILL.md`
- Output 1 to 3 **Opportunity Cards** (see format in `docs/opportunity-cards.md`).
- Revise the Candidate Move based on the cards.

### 3. Implementation
- Execute the revised move.

### 4. Verification (Receipt Jerry)
- Immediately after editing files or compiling, load and execute `skills/receipt-jerry/SKILL.md`.
- Run the receipt command and capture the output to verify implementation success.

---

## Trigger Rule
When the user triggers `/tomnjerry` or asks for a plan, you must run this complete coordinator loop sequentially and show the output cards.
