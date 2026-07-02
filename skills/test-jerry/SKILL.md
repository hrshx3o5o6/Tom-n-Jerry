---
name: test-jerry
description: Mine existing tests for mocks, mock-servers, factory helpers, test runners, and assertions before writing new tests.
triggers:
  - When writing a unit, integration, or E2E test file
  - When mocking API requests, databases, or third-party dependencies
  - When configuring a test suite, runner, or coverage target
---

# Test Jerry

Test Jerry mines the existing test files, fixtures, and setups in the repository to prevent the creation of duplicate mocks, database seed scripts, or redundant test configurations.

## Mission

Leverage existing test infrastructure. Do not write test boilerplate, mock servers, or test-data factories if the test suite already has these utilities. Reuse existing setups and follow project testing conventions.

---

## Explicit Triggers

This skill MUST be executed when:
1. Asked to add test coverage to a file, route, or helper.
2. Creating a new test file or test utility.
3. Setting up mock configurations for APIs, filesystems, or databases.

---

## Concrete Checks & Actions

1. **Locate Existing Test Suite:**
   - Scan the workspace for test directories (e.g., `tests/`, `__tests__/`, `*.test.js`, `*.spec.ts`, `conftest.py`).
2. **Scan for Mock Helpers:**
   - Look for files containing words like `mock`, `factory`, `fixture`, `helper`, or `setup`. Check if there is an existing database transactional rollback helper or API interceptor (like MSW, nock, or mockito).
3. **Analyze Existing Test Conventions:**
   - Read an existing, passing test file in the same folder to duplicate its syntax, imports, and mock scopes.

---

## Inline Scenario

* **Vague Plan (Naive):** "I need to test the payments endpoint. I will write a mock API interceptor using mock-service-worker, configure standard user details, write test cases checking card failures, and configure the test setup."
* **Jerry Opportunity Card:**
  - **Type:** reuse
  - **Claim:** The test suite already has a configured mock server and mock transaction data factory.
  - **Evidence:** Found helper `tests/mocks/server.js` and factory `tests/factories/transaction.js`.
  - **Move:** Import the existing transaction factory to generate payment payloads and let the global mock server intercept backend callbacks.
  - **Risk:** Ensure the mock server is configured to intercept the payments route path.
  - **Receipt:** Run the newly created test using the specific test file target command.

---

## Antipattern Traps

- **The Boilerplate Overload:** Writing 100 lines of custom user-data mock dictionary blocks when a `mockUser()` helper already exists.
- **Double Mocking:** Mocking a module in a test file when a global mock for that module is already active in the test setup file, causing confusing or silent failures.
- **Silent Failures:** Writing test assertions that don't check edge cases, or neglecting to verify the assertion runs (e.g., missing `await` or `expect.assertions()`).

---

## Output

Emit an opportunity card of type `reuse` outlining:
1. The test helpers, factories, mocks, or configs to reuse.
2. The custom mock setup work this bypasses.
3. The runner command that executes this specific test file.
