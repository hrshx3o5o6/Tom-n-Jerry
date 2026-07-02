---
name: delete-jerry
description: Use when a task may be solved by removing code, configuration, scope, dependency, or process instead of adding more.
triggers:
  - When cleaning up code debt
  - When fixing a bug in legacy or duplicate abstractions
  - Before writing complex wrappers or special-case handlers
---

# Delete Jerry

Delete Jerry finds solutions by removing work. The best code is no code, and the safest implementation removes redundant code, stale abstractions, or outdated configurations.

## Mission

Solve problems by subtracting. Eliminate obsolete features, collapse unnecessary wrappers, and narrow scope rather than building scaffolding to support bad paths.

---

## Explicit Triggers

This skill MUST be executed when:
1. Refactoring code that has duplicate files, helper functions, or configs.
2. Troubleshooting bugs in old modules or abstractions.
3. The prompt asks to "migrate", "cleanup", "refactor", or "simplify" components.

---

## Concrete Checks & Actions

1. **Verify Usage Count:**
   - Search the entire workspace for usages of the target helper, function, class, or route using `rg`. If usage is 0 or only exists in tests, it is candidate for deletion.
2. **Identify Abstraction Bloat:**
   - Check if a class or interface only has a single implementation that can be collapsed.
3. **Assess special-case branches:**
   - Examine conditional statements (`if/else`, `switch`) to see if an obsolete condition can be entirely removed to simplify the control flow.
4. **Detect redundant configuration files:**
   - Check if old settings, backup config files, or duplicate variables are overriding or cluttering the system.

---

## Inline Scenario

* **Vague Plan (Naive):** "The database query helper has a bug with timezone conversions. I will write a timezone wrapper module that intercepts queries, checks if they are legacy timestamps, adjusts them, and formats them."
* **Jerry Opportunity Card:**
  - **Type:** delete
  - **Claim:** The legacy timestamp code is unused and can be removed completely.
  - **Evidence:** Ripgrep search shows that `LegacyTimestampFormatter` is only called in a deprecated test file and a commented-out router script.
  - **Move:** Delete `LegacyTimestampFormatter`, the unused router script, and update the database query helper to use the standard timezone libraries directly.
  - **Risk:** Ensure no downstream APIs rely on the deprecated router script.
  - **Receipt:** Run the core query tests and verify the git diff shows line subtraction.

---

## Antipattern Traps

- **Destructive Deletion:** Never delete database schemas, tables, user data, or production code without confirming it is obsolete.
- **Premature Cleanup:** Do not delete code that is actively in progress or designed for upcoming features without developer confirmation.
- **Incomplete Deletion:** Do not leave dangling imports, broken types, or orphaned files when deleting a module.

---

## Output

Emit an opportunity card of type `delete` showing:
1. The exact files or code blocks to remove.
2. Evidence that the target is unused, obsolete, or harmful.
3. The receipt that proves the system is stable after removal.
