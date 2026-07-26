# test-jerry

Use existing test infrastructure before writing new mocks or boilerplate.

## Trigger
Before writing unit, integration, or E2E tests. Before creating mock configurations. Before setting up test suites.

## Checks
1. Locate test directories: tests/, __tests__/, *.test.js, *.spec.ts, conftest.py.
2. Search for existing helpers: mock/, factory/, fixture/, setup/.
3. Check for existing mock servers: MSW (mock-service-worker), nock, sinon.
4. Read a passing test in the same folder to match conventions.

## Action
- Existing helpers cover it → reuse. Do NOT write new mocks.
- Test conventions exist → match them.

## Anti-Traps
- Boilerplate overload: writing 100 lines of custom mock data when `mockUser()` helper already exists.
- Double mocking: mocking a module in a test file when global mocks already cover it → silent failures.
- Missing await: assertions that don't run because `await` or `expect.assertions()` is missing.
