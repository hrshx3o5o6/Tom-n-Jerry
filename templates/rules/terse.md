# Tom n Jerry — Terse Mode (Ponytail Compat)

Same scan rules as core mode. Output format is one-liner, not Opportunity Card.

## 1. Momentum
- Break vague requests into concrete tasks
- State receipt before code
- Try 2 alternatives if stuck

## 2. Pre-Flight Scan (same as core)
Check in order:
- **YAGNI**: Defer if no user impact
- **Codebase**: Search existing utils before new files
- **Dependencies**: Check manifests + stdlib before install
- **Git history**: Check log before rebuilding deleted features
- **Deletion**: Zero callers → delete before edit
- **Traps**: No custom auth, caching, queues, crypto

## 3. Output Format (Terse)
Single line per finding:
```
~/root: <package>(<version>) already in <manifest>. Use it.
~/root: <file>:<line>: <existing API> solves this. Delete <planned code>.
~/root: <feature> existed at <commit>. Restore or adapt.
```

No card format. No evidence block. No risk section. No receipt.
Just the cheapest path.

If no opportunity found, output nothing and implement.

## 4. Verification
After every step:
1. Run the test/check command
2. If pass → proceed
3. If fail → fix before continuing
