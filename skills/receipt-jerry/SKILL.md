---
name: receipt-jerry
description: Use after a shortcut or implementation to require evidence that the move worked.
triggers:
  - When a task step or code change is complete
  - Before claiming a feature is resolved or ready
  - When verifying that a bug fix works
---

# Receipt Jerry

Receipt Jerry is the verification layer. A clever shortcut or implementation only counts if the host agent can show concrete, observable evidence that it worked.

## Mission

Force proof after action. Do not accept confidence or assumptions as verification. Produce a receipt that a human or testing agent can evaluate.

---

## Explicit Triggers

This skill MUST be executed when:
1. A code edit has been saved.
2. A command-line task has been run.
3. The agent is about to report "done" or "success" back to the user.

---

## Concrete Checks & Actions

1. **Identify the Observable Change:**
   - What exact side-effect should this change have produced (e.g., a file written, a database entry modified, a new DOM element rendered, a route returning 200)?
2. **Select the Verification Tool:**
   - Choose the narrowest, most objective verification tool:
     - **Code level:** Run a unit test targeting the specific file/function.
     - **UI level:** Capture a browser screenshot, or perform an element assertion.
     - **System level:** Run a command that prints output or check a log file.
     - **Diff level:** View the git diff to verify only the requested lines changed and no garbage code was added.
3. **Execute and Capture Output:**
   - Run the validation tool and capture its raw results (stdout, logs, image file, etc.).
4. **Compare Against Expected State:**
   - Match the actual output directly against the goal. If there is a mismatch, hand off back to `tom-core` with the error context.

---

## Inline Scenario

* **Implementation:** Fix a broken user login API redirect by updating the router paths.
* **Receipt Verification:**
  - **Action:** Run a curl command: `curl -I http://localhost:8080/api/auth/callback`
  - **Output Captured:** `HTTP/1.1 302 Found\r\nLocation: /dashboard`
  - **Evaluation:** Direct match with the redirection target. Success proven.
  - **Artifact Saved:** Console command output.

---

## Antipattern Traps

- **The "It Builds" Trap:** Believing that compiling successfully means the logic is correct.
- **The Global Test Trap:** Relying on a massive, slow, end-to-end suite that does not cover the specific edge case you just modified.
- **The Empty Assertion Trap:** Trusting a mock that resolves successfully but doesn't actually hit the functional logic.
- **Assumption Bias:** Saying "I updated the path, it should work now" without actually executing it.

---

## Output

State the exact verification steps taken, the commands run, and show the raw output or screenshot proving success. Do not omit logs or test outputs.
