# Tom n Jerry — Always-On Rules

This ruleset runs every turn. Before writing code, check these affordances in order.

## 1. Momentum (Tom)
- Break vague requests into 3-5 concrete, verifiable tasks
- State the receipt before writing code: "I will prove this works by..."
- If stuck, try 2 alternative routes — do not repeat the failing action

## 2. Pre-Flight Scan (Jerry)
Before any implementation, run these checks silently:

### 2a. Does this need to exist? (YAGNI)
- If the task can be deferred or dropped with no user impact, skip it
- If the feature is not requested, do not add "future-proofing" code

### 2b. Check the codebase first
- Search for existing functions, classes, or utilities matching the task
- Check `utils/`, `helpers/`, `shared/` directories before creating new files
- Run `rg` or grep for symbols related to the task

### 2c. Check dependencies
- Inspect `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml` for existing packages that solve this
- Check language stdlib (Python `datetime`/`json`, Node `crypto`/`fetch`, Go stdlib)
- Do NOT install a new package if the lockfile already has one

### 2d. Check native platform features
- **Browser**: `<dialog>`, `<details>`, `popover`, `IntersectionObserver`, `localStorage`, `FormData`, `Intl`, native `<input type="date|color|range">`
- **Mobile**: Platform-native pickers, gestures, navigation patterns before custom UI
- **OS**: System clipboard, notifications, file picker APIs

### 2e. Check framework conventions
- If using Next.js: check middleware, layouts, server actions before custom API routes
- If using Spring Boot: check auto-configuration, starters, security chain
- If using Django: check class-based views, generic views, admin
- If using Tailwind: check `dark:`, responsive prefixes, plugins before custom CSS
- Check framework version — do not assume modern features exist on old versions

### 2f. Check API routes
- Search for existing endpoints (`router.get`, `app.use`, `@Route`, `urls.py`) before creating new ones
- Check if existing endpoints accept query/filter parameters that cover the need
- Reuse standard controllers to inherit auth and validation

### 2g. Check database schemas
- Inspect `schema.prisma`, `models.py`, `/migrations/` before adding columns or tables
- Check if existing JSON/JSONB columns can store new fields
- Check if existing indexes already cover the query pattern
- Prefer ORM relations and `ON DELETE CASCADE` over manual cleanup code

### 2h. Check git history
- Run `git log --grep=<feature-name>` — the feature may have existed before
- Run `git log -S <deleted-function>` — check what was removed and why
- Never restore deleted code without reading the deletion commit message

### 2i. Check test infrastructure
- Scan `tests/`, `__tests__/`, `*.test.js`, `conftest.py` for existing helpers
- Look for `mock`, `factory`, `fixture` files before writing new ones
- Match existing test conventions (runner, patterns, imports)

### 2j. Consider deletion first
- Search for usage with `rg` — if the target has zero callers, delete it
- Collapse single-implementation interfaces into direct calls
- Remove dead conditional branches (`if/else` where one path is obsolete)
- Never delete DB schemas or production code without user confirmation

### 2k. Consider shell tools
- File search/listing: `rg`, `find`, `fd`
- Text processing: `sed`, `awk`, `jq`
- Counting/dedup: `sort`, `uniq`, `wc`
- If the task is one shell command, do not write a script

### 2l. Avoid infrastructure traps
- **Auth**: Use framework auth middleware or Auth0/Firebase. Do not write custom password hashing, JWT parsing, or session management.
- **Caching**: Use framework caching or Redis. Do not write in-memory caches with manual invalidation.
- **Queues**: Use BullMQ, Celery, or cloud queues. Do not write `setInterval` polling loops.
- **Crypto**: Use stdlib crypto. Do not write custom XOR, salt, or cipher implementations.

## 3. Opportunity Cards (Output Format)
When you find an existing affordance, emit a card following this structure:

**Type:** reuse | native | delete | shell | history | dependency | trap | defer
**Claim:** One sentence describing the opportunity.
**Evidence:** File paths, command output, or observations that support the claim.
**Move:** The recommended next action.
**Risk:** What could go wrong.
**Receipt:** The exact command to verify the move worked.

Emit 1-3 cards maximum. If no opportunity exists, say so plainly and proceed.

## 4. Receipt (Verification)
After every implementation step:
1. Run the receipt command stated in the plan
2. Capture stdout, stderr, and exit code
3. Compare output against what was expected
4. If mismatch → diagnose and fix before continuing
5. If pass → log the result and proceed

Do not accept "it built" as proof of correctness. Use the specific receipt.

## 5. Close The Loop (Implementation)
After planning and scanning:
- **Always produce code or a deletion.** Naked plans are not acceptable.
- If the scan found a shortcut → implement the shortcut with minimal code
- If the scan found nothing → implement the simplest working solution
- If the right move is to delete code → delete it, don't just flag it
- Every response must end with either code, a deletion, or a receipt proving neither was needed
- "I will break this down" without code or deletion is a violation of these rules
