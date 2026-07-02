---
name: git-jerry
description: Use before rebuilding behavior that may already exist in repository history, related branches, previous commits, or reverted code.
triggers:
  - When recreating a deleted file or feature
  - When diagnosing when a bug was introduced
  - When reviewing code that was recently changed or reverted
---

# Git Jerry

Git Jerry mines repository history before reimplementing code. When features or configurations seem familiar, recently deleted, or modified, the solution is often in git history.

## Mission

Search historical branches and commits. Avoid building features or files that already existed in previous states of the workspace.

---

## Explicit Triggers

This skill MUST be executed when:
1. Re-implementing a feature or helper that was previously deleted.
2. Checking why a certain configuration or structure was modified in the past.
3. Asked to restore, revert, or patch a buggy section of the codebase.

---

## Concrete Checks & Actions

1. **Search Git Commits:**
   - Run `git log --grep="feature-name"` or `git log -S "deleted_function_name"` to locate commits where the feature was introduced or deleted.
2. **Retrieve Historical Code:**
   - Use `git show <commit_hash>:<path/to/file>` to view deleted content without checking out previous states.
3. **Analyze Blame & History:**
   - Run `git blame <file>` on lines that seem problematic to identify why changes were made.
4. **Compare Branches:**
   - Check other local or remote branches (`git branch -a`) to see if another developer already has a working implementation.

---

## Inline Scenario

* **Vague Plan (Naive):** "The marketing team wants the discount coupon banner back. I will recreate the banner component, styles, context triggers, and logic in React."
* **Jerry Opportunity Card:**
  - **Type:** history
  - **Claim:** The discount coupon banner component was deleted 3 weeks ago and can be retrieved directly from git history.
  - **Evidence:** Running `git log --oneline --all -- "*Banner*"` shows commit `8f21ab4` titled `remove discount banner`.
  - **Move:** Run `git checkout 8f21ab4~1 -- src/components/DiscountBanner.js` to restore the code.
  - **Risk:** The old banner component may rely on styling classes that were refactored.
  - **Receipt:** Inspect file creation and verify rendering via screenshot.

---

## Antipattern Traps

- **The Zombie Code Trap:** Restoring historical code without understanding *why* it was deleted (e.g., security flaws, memory leaks, performance bugs). Always inspect the deletion commit message.
- **Destructive Checkout:** Running `git checkout` or `git reset` commands that overwrite or discard local uncommitted user changes.
- **Merge Conflict Trap:** Dragging in huge legacy files that conflict with the modern design system or dependencies.

---

## Output

Emit an opportunity card of type `history` detailing:
1. The historical file, helper, or commit identified.
2. The exact git commands used to locate and recover it.
3. The receipt showing the successfully recovered file and compile check.
