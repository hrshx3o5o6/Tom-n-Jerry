# Evaluation & Benchmarking Guide

Use this guide to run a Before vs. After comparison of your coding agent with and without the **Tom n Jerry** skill pack.

---

## 1. Core Metrics

| Metric | Measurement | Ideal Direction |
| :--- | :--- | :--- |
| **New Lines of Code (LOC)** | Total added lines in `git diff --stat` | Down (prefer subtraction or reuse) |
| **New Dependencies** | Count of new packages added to package/lock files | Down (prefer standard library or existing) |
| **Execution Steps** | Number of code files created/modified | Down (prefer singular narrow edits) |
| **Receipt Pass** | Did the implementation pass the verification target? | Boolean (Must be True) |
| **Time to Ship** | Total seconds from prompt to working receipt | Down |

---

## 2. Benchmark Tasks

### Task 1: Utility Overbuild (e.g., Date Formatting)
- **Goal:** Format a database timestamp into a human-readable date.
- **Before Expectation:** Agent installs `moment`/`date-fns` or writes manual string manipulation wrappers.
- **After Expectation (Jerry):** Agent uses `Intl.DateTimeFormat` or existing date helpers.

### Task 2: Scripting Overbuild (e.g., TODO Finder)
- **Goal:** Recursive search and count of TODO tags inside project code.
- **Before Expectation:** Agent writes a custom file-traversal script (`find-todos.js` or `todos.py`).
- **After Expectation (Jerry):** Agent executes a single `rg` or `grep` shell command.

### Task 3: History Rebuilding (e.g., Restoring Feature)
- **Goal:** Restore a deleted feature or configuration.
- **Before Expectation:** Agent rewrites the layout/logic from scratch.
- **After Expectation (Jerry):** Agent scans git history using `git log` and retrieves the old file code.

---

## 3. Comparison Matrix Template

Record your benchmark runs here:

| Task ID | Run Type | New LOC | New Packages | Verification (Receipt) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Task 1** | Baseline (No Jerry) | | | | |
| **Task 1** | Tom n Jerry | | | | |
| **Task 2** | Baseline (No Jerry) | | | | |
| **Task 2** | Tom n Jerry | | | | |
| **Task 3** | Baseline (No Jerry) | | | | |
| **Task 3** | Tom n Jerry | | | | |
