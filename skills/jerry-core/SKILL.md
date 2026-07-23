---
name: jerry-core
description: Use before implementation to detect cheaper existing affordances, avoid overbuilding, and emit opportunity cards.
triggers:
  - Before writing code or modifying lines
  - Before adding libraries or packages
  - When starting a task plan or candidate move
---

# Jerry Core

Jerry is the street-smart opportunity layer. Use this skill before writing code, adding dependencies, creating abstractions, or implementing a planned change.

## Mission

Find the cheapest existing affordance that can satisfy the user's goal. Intercept the current candidate move, look for a better/cheaper one, and prevent overbuilding.

---

## Explicit Triggers

This skill MUST be executed when:
1. A candidate plan or next step has been proposed by `tom-core` or the host agent.
2. The agent is about to create a new folder, file, class, database table, or utility.
3. The agent is about to execute a package manager install command (e.g., `npm i`, `pip install`).

---

## Concrete Checks & Actions

1. **Scan Workspace Context:**
   - Search the directory structure for files with matching names, functions, or utilities.
   - Run a quick text search using `rg` or a grep tool for symbols related to the task.
2. **Scan Package Manifests:**
   - Inspect lockfiles or dependency manifests (`package.json`, `requirements.txt`, etc.) to see if libraries solving this are already installed.
3. **Assess Framework Capabilities:**
   - Identify the framework in use and verify if the desired feature exists natively (e.g., Next.js routing, Tailwind dark mode).
4. **Evaluate Shell Affordances:**
   - Determine if the task is a file processing/counting/filtering problem solvable in one line of shell script rather than a custom program.
5. **Inspect Repository History:**
   - Check if a similar feature existed previously and was deleted or changed by looking at git history.
6. **Detect Domain Out-of-Scope:**
   - If the codebase uses a framework, language, or system not covered by the core specialized Jerrys (e.g., Terraform/IaC, Swift/iOS, Unity/C#):
     - **Action:** Optionally draft a custom skill file under `skills/custom-<domain-name>/SKILL.md` using the template in `CONTRIBUTING.md`. Ask user permission before writing new files.

---

## Inline Scenario

* **Vague Plan (Naive):** "I need to build an automated cron scheduling system in Node.js to clean up database logs every night, so I will write a custom cron worker script and configure a process manager."
* **Jerry Opportunity Card:**
  - **Type:** native
  - **Claim:** The platform or runtime host already supports automated cron triggers (e.g., Firebase Functions scheduling, GitHub Actions scheduler, or system `crontab`).
  - **Evidence:** The project is deployed on Firebase; functions are already declared in `functions/index.js`.
  - **Move:** Declare a scheduled function block in the existing index file.
  - **Risk:** Requires deployment permissions to test completely.
  - **Receipt:** Deploy a dry-run scheduled task or verify local emulator invocation logs.

---

## Antipattern Traps

- **The Research Trap:** Do not spend more than a few minutes searching for shortcuts on a trivial, 5-line task.
- **The Speculative Reuse Trap:** Do not reuse code that is fundamentally incompatible just because the name is similar.
- **The Invisible Verification Trap:** Do not recommend a shortcut that cannot be verified with a concrete receipt.

---

## Handoff & Output

Emit 1 to 3 opportunity cards following the format in `docs/opportunity-cards.md`. 
If no meaningful shortcut exists, say so plainly and hand off execution back to momentum (`tom-core`).
