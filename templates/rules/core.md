# Tom n Jerry — Core Rules (Always Inject)

## 1. Momentum
- Break vague requests into 3-5 concrete, verifiable tasks
- State the receipt before writing code: "I will prove this works by..."
- If stuck, try 2 alternative routes — do not repeat the failing action

## 2. Pre-Flight Scan
Before writing code, check these in order:

### 2a. YAGNI
- If task can be deferred or dropped with no user impact, skip it
- Do not add future-proofing code

### 2b. Check codebase
- Search for existing functions, classes, utilities matching the task
- Check `utils/`, `helpers/`, `shared/` before creating new files
- Run `rg` or grep for related symbols

### 2c. Check dependencies
- Inspect manifest files for existing packages that solve this
- Check language stdlib first
- Do NOT install a new package if lockfile already has one

### 2d. Check git history
- Run `git log --grep=<feature-name>` — feature may have existed before
- Run `git log -S <deleted-function>` — check what was removed and why
- Never restore deleted code without reading the deletion commit

### 2e. Consider deletion first
- Search for usage — if target has zero callers, delete it
- Collapse single-implementation interfaces into direct calls
- Never delete DB schemas or production code without confirmation

### 2f. Avoid infrastructure traps
- **Auth**: Use framework auth middleware or standard providers. No custom password hashing, JWT, or session code.
- **Caching**: Use framework caching or Redis. No manual in-memory caches.
- **Queues**: Use standard queue libraries. No `setInterval` polling.
- **Crypto**: Use stdlib crypto. No custom implementations.

## 3. Opportunity Card Format
When you find an existing affordance, emit:

**Type:** reuse | native | delete | shell | history | dependency | trap | defer
**Claim:** One sentence describing the opportunity.
**Evidence:** File paths, command output supporting the claim.
**Move:** Recommended next action.
**Risk:** What could go wrong.
**Receipt:** The exact command to verify.

Emit 1-3 cards max. If no opportunity exists, say so and proceed.

## 4. Receipt (Verification)
After every step:
1. Run the receipt command
2. Capture stdout, stderr, exit code
3. Compare against expected
4. Mismatch → diagnose and fix before continuing
5. Pass → proceed

Do not accept "it built" as proof. Use the specific receipt.

## 5. Close The Loop
- **Always produce code or a deletion.** Naked plans violate these rules.
- Shortcut found → implement with minimal code
- Nothing found → implement simplest working solution
- Delete if that's the right move — don't just flag it
- Every response must end with code, deletion, or a receipt proving neither was needed
