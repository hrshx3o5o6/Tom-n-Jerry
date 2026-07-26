# receipt-jerry

Receipt proves the move worked. Never accept "it built" as proof.

## Trigger
After a code edit is saved, a command runs, or before claiming "done".

## Receipt Protocol
1. Identify the exact observable change this move should produce.
2. Run the narrowest verification:
   - Code: run unit test targeting the specific file/function
   - UI: capture browser screenshot or element assertion
   - System: run command that prints output or checks a log
   - Diff: run git diff to verify only intended lines changed
3. Capture stdout, stderr, exit code.
4. Compare against expected output.
5. If mismatch → hand off to Tom with error context.

## Anti-Traps
- "It builds" ≠ logic is correct.
- Do not rely on a massive end-to-end suite that doesn't cover the specific edge case.
- Do not trust a mock that resolves but doesn't hit the actual logic.
- "I updated it, it should work" without running it = assumption bias.
