---
name: unix-jerry
description: Use before writing custom scripts for file search, text processing, counting, filtering, transformation, or inspection.
triggers:
  - When asked to write a script for file parsing, searching, or manipulation
  - When asked to clean up, extract, or count lines/files in a directory
  - When batch processing strings, directories, or logs
---

# Unix Jerry

Unix Jerry reaches for command-line tools and shell utilities before writing custom scripts. Many automation tasks are solved with standard shell tools.

## Mission

Solve system tasks with shell tools. Prefer standard tools (`rg`, `find`, `sed`, `awk`, `jq`, `sort`, `uniq`, `xargs`) over custom JavaScript, Python, or Ruby scripts.

---

## Explicit Triggers

This skill MUST be executed when:
1. Planning to write a one-off utility script or CLI tool.
2. Asked to list, count, filter, replace, or analyze files in the repository.
3. Asked to extract properties, keys, or logs from a configuration/data file.

---

## Concrete Checks & Actions

1. **Evaluate Shell Alternates:**
   - For string search: Use `rg` or `grep`.
   - For file selection/listing: Use `find` or globbing patterns.
   - For JSON inspection: Use `jq`.
   - For CSV/log filtering: Use `awk` or `sed`.
   - For de-duplication: Use `sort` and `uniq`.
2. **Check Command Portability:**
   - Ensure the proposed shell commands run on the host operating system (e.g., mac vs. linux vs. Windows).
3. **Verify Safety:**
   - Verify that any replacement commands (`sed -i` or destructive commands) are safe, limited to exact directories, and won't affect git status globally.

---

## Inline Scenario

* **Vague Plan (Naive):** "I will write a Node.js script called `count-todos.js` that recursively reads all files, checks if they end in `.js`, parses their content line-by-line, checks for the string 'TODO', counts the matches, and outputs a summary."
* **Jerry Opportunity Card:**
  - **Type:** shell
  - **Claim:** A single `rg` command can recursively count all TODO tags inside JavaScript files.
  - **Evidence:** `rg` is installed and functional on the host machine.
  - **Move:** Run `rg -t js -c -i 'todo'` instead of building a script.
  - **Risk:** None. Read-only command.
  - **Receipt:** Inspect terminal output showing counts per file.

---

## Antipattern Traps

- **The Dense Magic Trap:** Writing shell scripts that are so complex, unreadable, or nested that they become unstable or hard to debug. If a command requires 3 pipes and custom regex buffers, a simple script may be safer.
- **The Global Destructive Trap:** Running recursive `find | xargs rm` or similar commands without testing them with a dry-run first.
- **The Non-Portable Trap:** Writing custom bash-only functions that crash on environments where `sh` or `zsh` behaves differently.

---

## Output

Emit an opportunity card of type `shell` outlining:
1. The exact shell command or pipeline to run.
2. The manual script it replaces.
3. The expected receipt output from the shell execution.
