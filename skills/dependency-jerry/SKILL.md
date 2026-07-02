---
name: dependency-jerry
description: Scans package manifests and lockfiles to reuse existing libraries and utilities instead of introducing new packages.
triggers:
  - When about to run npm install, pip install, cargo add, or gem install
  - When writing date formatting, deep copy, query parsing, or fetch wrappers
  - When trying to solve common utility tasks (lodash-like functions)
---

# Dependency Jerry

Dependency Jerry scans the project's lockfiles and manifest files to reuse existing packages and utility code instead of downloading new dependencies.

## Mission

Minimize external dependencies. Every new package adds security risk, bundle size, compile time, and maintenance overhead. Exploiting dependencies already listed in `package.json`, `Cargo.toml`, `requirements.txt`, or standard libraries is the street-smart move.

---

## Explicit Triggers

This skill MUST be executed when:
1. Planning to install a new dependency via a package manager.
2. Building common utility helpers (e.g., date manipulation, object cloning, state management, HTTP requests).
3. Resolving utility-level bugs.

---

## Concrete Checks & Actions

1. **Check Manifests and Lockfiles:**
   - Search manifest files (`package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`) for existing packages that overlap with the target feature.
2. **Scan Language Standard Library:**
   - Verify if the language standard library already has the tool (e.g., Python `datetime` / `json`, Node.js native `crypto` or `fetch`, Go standard libraries).
3. **Analyze Existing Utility Folders:**
   - Look for internal directories named `utils/`, `helpers/`, `services/`, or `shared/` to check if a colleague has already written a wrapper for this.

---

## Inline Scenario

* **Vague Plan (Naive):** "I need to format dates for our payment receipts. I will install `moment.js` or `date-fns` to format timestamps into readable strings."
* **Jerry Opportunity Card:**
  - **Type:** dependency
  - **Claim:** The browser and Node.js standard libraries already have robust localization and date formatting capabilities using `Intl.DateTimeFormat`.
  - **Evidence:** `Intl` is supported natively in modern JS/TS runtimes.
  - **Move:** Use `new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)` instead of installing a library.
  - **Risk:** Edge-case timezones require verification.
  - **Receipt:** Run a local console script logging formatting output and check it matches requirements.

---

## Antipattern Traps

- **The Micro-Dependency Trap:** Installing a package for a 3-line utility function (e.g., `is-odd`, `left-pad`, `deep-merge`). Write the utility inline or find it in an existing core package (like lodash, if already installed).
- **Multiple Versions Trap:** Installing a dependency that is already installed but under a slightly different name or version, leading to duplicate libraries in bundles.

---

## Output

Emit an opportunity card of type `dependency` detailing:
1. The existing package, standard library utility, or utility code to reuse.
2. The package install command to skip.
3. The receipt that verifies correct output using the existing utility.
