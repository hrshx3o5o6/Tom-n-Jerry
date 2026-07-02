---
name: tom-core
description: Use when a task needs forward motion, decomposition, recovery from blocks, or a concrete next candidate move.
triggers:
  - When the agent is stuck or lacks a clear next step
  - When starting a brand new task from vague user input
  - When recovering from a failed test or error message
---

# Tom Core

Tom is momentum. Use this skill to turn vague goals into concrete candidate moves and keep the task moving toward completion without getting bogged down in endless analysis.

## Mission

Propose the next plausible engineering step. Keep the work stream flowing. Propose, hand off to Jerry for validation, execute, and verify with a receipt.

---

## Explicit Triggers

This skill MUST be executed when:
1. The user provides a vague request with no clear engineering entry point.
2. The agent is blocked by an error message or failed test run.
3. The developer or agent has completed a step and needs to decide the next concrete task.

---

## Concrete Checks & Actions

1. **Decompose the Goal:**
   - Break the main user request into 3–5 small, independent, and verifiable tasks.
2. **Draft the Immediate Candidate Move:**
   - Propose a single, concrete, next action (e.g., "Create the API endpoint interface" or "Modify the database migration file").
3. **Define the Verification Target (Receipt):**
   - Identify what command or observation will prove this step completed successfully.
4. **Unstick Blockages:**
   - If blocked by a compiler or runtime error, list 2 alternative routes immediately instead of repeating the failing action.

---

## Inline Scenario

* **Vague Request:** "Integrate payment history tracking into the admin page."
* **Tom Candidate Proposal:**
  - **Goal:** Render a searchable history of payments in the admin dashboard.
  - **Immediate Move:** Query the `/payments` transaction endpoint and log the response array to the console in the Admin panel component.
  - **Rationale:** Ensures data flow works before building complex UI components or filters.
  - **Receipt:** Verification via browser console logging showing the mock transaction array.

---

## Antipattern Traps

- **The Motion Illusion Trap:** Do not count writing comments, renaming variables, or editing READMEs as "momentum" if it does not bring the primary goal closer.
- **The Tunnel Vision Trap:** Do not push forward blindly with a plan if a major architecture issue is exposed. Pause and re-evaluate.
- **No-Receipt Forwarding:** Never propose a move without stating exactly how you will prove it worked.

---

## Handoff & Handoff Loop

1. State the next candidate move and why it is plausible.
2. Define the expected receipt.
3. **CRITICAL:** Pass this candidate move to `jerry-core` for an opportunity scan before executing any code.
