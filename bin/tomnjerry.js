#!/usr/bin/env node

// Hot path: harnesses spawn this on every hook event. Dispatch before loading
// anything else so hooks stay fast and can't be broken by CLI-only code.
if (process.argv[2] === 'hook') {
  require('../adapters/command').main(process.argv.slice(3));
  return;
}

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const PKG = require('../package.json');
const SOURCE_DIR = path.join(__dirname, '..');
const TNJ_DIR = path.join(SOURCE_DIR, 'tnj');
const TEMPLATES_DIR = path.join(SOURCE_DIR, 'templates');

const REQUIRED_SKILLS = [
  'tom-core', 'jerry-core', 'receipt-jerry', 'browser-jerry',
  'framework-jerry', 'dependency-jerry', 'db-jerry', 'api-jerry',
  'git-jerry', 'delete-jerry', 'unix-jerry', 'trap-jerry', 'test-jerry'
];

const GLOBAL_AGENTS_PATH = path.join(os.homedir(), '.config', 'opencode', 'AGENTS.md');

const TNJ_GLOBAL_BLOCK = `
<!-- tnj-global-begin -->
# TNJ: Tom n Jerry Loop Engine

YOU MUST RUN THIS LOOP EVERY TURN.

## State Machine

Every user request runs through these states in order. Each state has a mandatory output format.

\`\`\`
                   User Request
                        │
                        ▼
                    ┌───────┐
        ┌───────────│  TOM   │
        │           │propose │
        │           └───┬───┘
        │               │
        │               ▼
        │           ┌───────┐
        │           │ LOOP- │  ← DECISION POINT
        │           │ CHECK │
        │           └───┬───┘
        │               │
        │        ┌──────┴──────┐
        │        │             │
        │   Scope expands  Scope same
        │        │             │
        │        ▼             │
        │   ┌────────┐         │
        │   │ JERRY  │         │
        │   │ scan   │         │
        │   └───┬────┘         │
        │       │              │
        │   ┌───┴────┐         │
        │   │ Card │  │        │
        │   └───┬────┘         │
        │       │              │
        └───┐───┘              │
            │                  │
            ▼                  │
        ┌───────┐              │
        │ IMPLE- │◄─────────────┘
        │  MENT  │
        └───┬───┘
            │
            ▼
        ┌───────┐
        │RECEIPT│
        └───┬───┘
            │
            ▼
        ┌───────┐
        │TEACHER│  ← reflects, writes .tnj/loop-state.json
        └───┬───┘
            │
            └──────→ Back to TOM (next action or idle)
\`\`\`

## State Definitions

### 1. Tom (Momentum)
Propose ONE concrete next action. Be specific.
"I'll add express-rate-limit middleware to /api/auth routes."
State the receipt: "I'll prove it worked by running curl -I /api/auth/login."

Write \`.tnj/loop-state.json\`:
\`\`\`json
{ "step": "LOOP-CHECK", "proposal": "add express-rate-limit", "receipt": "curl -I /api/auth/login" }
\`\`\`

### 2. LOOP-CHECK (Mandatory Decision Point)

Before implementing, you MUST declare whether the proposed action expands scope beyond the previous action.

**Scope expands (run JERRY) when:**
- New npm/pip/cargo/Go dependency
- New route files, controllers, or handlers
- Any auth, middleware, crypto, password, session management
- Database schema change (new column, table, migration)
- Framework config change (next.config, tailwind.config, application.properties)
- New UI component (not editing an existing one)
- Git history might reveal deleted code
- Unsure whether something exists in the codebase
- New file creation outside existing patterns

**Scope same (skip JERRY) when:**
- Editing a single function within a file already in scope
- Adding comments, renaming variables, formatting
- Continuing implementation of something that just passed RECEIPT — same file, same pattern
- Running tests or verification commands
- Pure refactoring that doesn't change behavior

**Output format:**
\`\`\`
[LOOP-CHECK] Decision: YES | NO
Reasoning: <2-3 sentences explaining scope analysis>
\`\`\`

Then write \`.tnj/loop-state.json\`:
\`\`\`json
{ "step": "JERRY" | "IMPLEMENT" }
\`\`\`

### 3. Jerry (Street Smarts)
Only runs when LOOP-CHECK returned YES (scope expands).

Read \`.tnj/index.json\` — the FULL catalog including any learnings entries. Match the current task intent + tech stack against ALL entries' trigger + keywords.

For each matching entry:
- If \`path\` starts with \`skills/\` → read \`.tnj/skills/<skill>/SKILL.md\`
- If \`path\` starts with \`learnings/\` → read \`.tnj/learnings/<topic>.md\`

Run the checks from the loaded file.
- If a shortcut exists → emit Opportunity Card → Tom implements the shortcut.
- If no shortcut → Tom implements directly.

**Never skip learnings.** Learnings accumulate across projects and contain the most task-specific patterns. Check them on every JERRY scan.

Write \`.tnj/loop-state.json\`:
\`\`\`json
{ "step": "IMPLEMENT", "opportunityCard": true | false }
\`\`\`

### 4. Receipt (Proof)
After every implementation step, run the receipt command.
Capture stdout, stderr, exit code. Compare against expected.
If mismatch → diagnose and fix. If pass → confirm and proceed.

Write \`.tnj/loop-state.json\`:
\`\`\`json
{ "step": "TEACHER", "lastReceipt": { "command": "curl ...", "result": "PASS" } }
\`\`\`

Then Teacher runs and MUST produce output (see Teacher step).

### 5. Teacher (Learning)
After every task completion (Receipt passed), Teacher MUST produce output:

**Option A — Learning found:**
Write \`.tnj/learnings/<topic>.md\` (5-15 lines, concrete pattern + trigger + action + checks).
THEN append the new skill entry to \`.tnj/index.json\` with its trigger + keywords so JERRY can find it later. This is mandatory — a learning file not in the index is never read again.

**Option B — No pattern found:**
Set \`learningsSkipped: true\` with explicit reason in loop-state.json.

**There is no Option C. Skipping is not optional.**

Write \`.tnj/loop-state.json\`:
\`\`\`json
{ "step": "TOM", "learningsWritten": ["<topic>"], "learningsSkipped": false }
// OR
{ "step": "TOM", "learningsSkipped": true, "learningsSkipReason": "<why no pattern>" }
\`\`\`

Receipt: Either a learnings file exists in \`.tnj/learnings/\` OR \`learningsSkipped: true\` with non-empty reason.

### 6. Loop
After Teacher → loop back to Tom for next action.
The loop never truly exits — it idles at TOM waiting for the next user request.

## Loop State File (\`.tnj/loop-state.json\`)

The model writes this file after EVERY state transition.
The model reads this file at the START of every turn to restore loop context.

If the file exists and \`step\` is \`TOM\` with no pending actions → fresh task, start full loop.
If the file exists and \`step\` is not \`TOM\` → resume from that state.
If the file doesn't exist → start fresh.

This enables multi-session persistence: Session A writes \`{ step: "RECEIPT" }\`, Session B resumes from RECEIPT.

**Required fields per step:**

| Step | Required Fields |
|------|----------------|
| TOM | \`step\`, \`proposal\`, \`receipt\` |
| LOOP-CHECK | \`step\` |
| JERRY | \`step\`, \`opportunityCard\` |
| IMPLEMENT | \`step\`, \`proposal\`, \`receipt\`, \`opportunityCard\` |
| TEACHER | \`step\`, \`lastReceipt\` — THEN Teacher produces: \`learningsWritten\` array OR \`learningsSkipped: true\` + \`learningsSkipReason\` |

## Opportunity Card Format

If shortcut found, response MUST start with:

**Opportunity Card**
**Type:** reuse | native | delete | shell | history | dependency | trap | defer
**Claim:** One sentence.
**Evidence:** File paths, command output.
**Move:** Exact action.
**Receipt:** Verification command.

If no shortcut found: "No opportunity found."

## Skill Index (\`.tnj/index.json\`)

Jerry reads this first to find relevant skills. Format:
\`\`\`json
{
  "skills": [{
    "id": "descriptive-name",
    "trigger": "when-to-read",
    "keywords": ["intent", "tech", "context"],
    "path": "skills/name/SKILL.md",
    "type": "generic|custom"
  }]
}
\`\`\`

## Skill Creation Rules

- Save only patterns that apply to 2+ future tasks.
- Be concise: 5-15 lines. Include trigger condition, checks, example.
- Learning file: .tnj/learnings/lowercase-hyphens.md
- Append entry to \`.tnj/index.json\` after writing.

## Anti-Traps

- Skipping Jerry without declaring LOOP-CHECK decision = violation.
- Running Jerry when scope is same = waste. Don't.
- Tom without Jerry = overbuilding. Always scan when scope expands.
- Jerry without Tom = analysis paralysis. Always implement after scanning.
- Receipt without a command = "it built" ≠ it works. Always run verification.
- Teacher with no output = violation. Always write learnings OR skip with explicit reason.
- Loop without state file write = state loss. Always write after every step.
<!-- tnj-global-end -->
`;

const command = process.argv[2];
const flag = process.argv[3];

const exitWith = promise => promise.then(code => { process.exitCode = code; }, err => {
  console.error(`✖ ${err.message}`);
  process.exitCode = 1;
});

switch (command) {
  case 'setup':
    exitWith(require('../cli/setup').setup(process.argv.slice(3)));
    break;
  case 'remove':
    exitWith(require('../cli/setup').remove(process.argv.slice(3)));
    break;
  case 'stats':
    process.exitCode = require('../cli/stats').stats(process.argv.slice(3));
    break;
  case 'doctor':
    if (flag === '--loop') {
      runDoctorLoop();
    } else {
      runDoctor();
    }
    break;
  case 'init':
  case undefined:
    runInit();
    break;
  case 'install-global':
    runInstallGlobal();
    break;
  case 'remove-global':
    runRemoveGlobal();
    break;
  case 'check-updates':
    runCheckUpdates();
    break;
  case '--help':
  case '-h':
    printHelp();
    break;
  case '--version':
  case '-v':
    console.log(PKG.version);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: tomnjerry [setup|remove|doctor|stats|init|check-updates|install-global|remove-global|--help|--version]');
    process.exit(1);
}

// ─── Doctor ────────────────────────────────────────────────────────────────────

function runDoctor() {
  console.log('🐭 Tom n Jerry — Diagnostic Report\n');
  let allPassed = true;

  console.log(`Version: ${PKG.version}`);
  checkLatestVersion().then(latest => {
    if (latest && latest !== PKG.version) {
      console.warn(`  ⚠ Update available: ${latest} (installed: ${PKG.version})`);
    }
  });

  // TNJ structure check
  console.log(`\nTNJ Structure:`);
  const tnjExists = fs.existsSync(TNJ_DIR);
  if (!tnjExists) {
    console.error(`  ✖ .tnj/ directory not found at ${TNJ_DIR}`);
    allPassed = false;
  } else {
    console.log(`  ✔ .tnj/ directory exists`);
  }

  // Skill index check
  const indexPath = path.join(TNJ_DIR, 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const skillCount = index.skills ? index.skills.length : 0;
      console.log(`  ✔ index.json: ${skillCount} skills registered`);
    } catch {
      console.error(`  ✖ index.json is malformed JSON`);
      allPassed = false;
    }
  } else {
    console.error(`  ✖ Missing: tnj/index.json`);
    allPassed = false;
  }

  // Skills check
  console.log(`\nSkills (${REQUIRED_SKILLS.length} required):`);
  REQUIRED_SKILLS.forEach(name => {
    const filePath = path.join(TNJ_DIR, 'skills', name, 'SKILL.md');
    if (!fs.existsSync(filePath)) {
      console.error(`  ✖ Missing: skills/${name}/SKILL.md`);
      allPassed = false;
    } else {
      console.log(`  ✔ ${name}`);
    }
  });

  // Always-on rules template check
  const rulesPath = path.join(TEMPLATES_DIR, 'always-on-rules.md');
  if (fs.existsSync(rulesPath)) {
    console.log(`\n  ✔ always-on-rules.md`);
  } else {
    console.warn(`  ⚠ Missing: templates/always-on-rules.md`);
  }

  // Global AGENTS.md check
  console.log(`\nGlobal AGENTS.md:`);
  if (fs.existsSync(GLOBAL_AGENTS_PATH)) {
    const content = fs.readFileSync(GLOBAL_AGENTS_PATH, 'utf-8');
    if (content.includes('<!-- tnj-global-begin -->')) {
      console.log(`  ✔ TNJ loop protocol installed globally`);
    } else {
      console.warn(`  ⚠ AGENTS.md exists but TNJ block not found. Run install-global.`);
    }
  } else {
    console.log(`  ℹ No global AGENTS.md (run install-global to create)`);
  }

  // Project initialization check
  const targetDir = process.cwd();
  const projectTnj = path.join(targetDir, '.tnj');
  if (fs.existsSync(projectTnj)) {
    const installed = fs.readdirSync(projectTnj).filter(f => f !== '.gitkeep');
    console.log(`\nProject status: ${installed.length} items in .tnj/`);
  } else {
    console.log(`\nProject status: not initialized (run: tomnjerry setup --project)`);
  }

  const { findRoot } = require('../core/root');
  if (!require('../cli/doctor').checkHooks({ root: findRoot(targetDir, {}) })) allPassed = false;

  console.log(allPassed ? '\n✔ All checks passed.' : '\n⚠ Some checks failed.');
  process.exit(allPassed ? 0 : 1);
}

function runDoctorLoop() {
  const targetDir = process.cwd();
  const loopStatePath = path.join(targetDir, '.tnj', 'loop-state.json');

  console.log('🔄 Tom n Jerry — Loop Status\n');

  if (!fs.existsSync(loopStatePath)) {
    console.log('  ℹ No loop-state.json found.');
    console.log('     The loop has not been started yet, or was run in a different session.\n');
    return;
  }

  try {
    const state = JSON.parse(fs.readFileSync(loopStatePath, 'utf-8'));
    console.log(`  Step: ${state.step || 'unknown'}`);
    if (state.proposal) console.log(`  Proposal: ${state.proposal}`);
    if (state.receipt) console.log(`  Receipt: ${state.receipt}`);
    if (state.opportunityCard !== null) {
      console.log(`  Opportunity Card: ${state.opportunityCard ? 'true' : 'false'}`);
    }
    if (state.lastReceipt) {
      console.log(`  Last Receipt: ${JSON.stringify(state.lastReceipt)}`);
    }
    if (state.learningsWritten && state.learningsWritten.length > 0) {
      console.log(`  Learnings Written: ${state.learningsWritten.join(', ')}`);
    }
    if (state.sessionComplete !== undefined) {
      console.log(`  Session Complete: ${state.sessionComplete}`);
    }
    if (state.pendingActions && state.pendingActions.length > 0) {
      console.log(`  Pending Actions: ${state.pendingActions.join(', ')}`);
    }
    console.log('');
  } catch (err) {
    console.error(`  ✖ Failed to read loop-state.json: ${err.message}\n`);
    process.exit(1);
  }
}

function checkLatestVersion() {
  return new Promise(resolve => {
    const req = https.get(
      `https://registry.npmjs.org/@hrshx3o5o6/tomnjerry/latest`,
      { timeout: 3000 },
      res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data).version); }
          catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ─── Init ──────────────────────────────────────────────────────────────────────

function runInit() {
  const targetDir = process.cwd();
  const projectTnj = path.join(targetDir, '.tnj');

  console.log('🐭 Tom n Jerry: Initializing project...\n');

  let interrupted = false;

  process.on('SIGINT', () => {
    if (interrupted) {
      console.error('\n✖ Force exiting.');
      process.exit(1);
    }
    interrupted = true;
    console.error('\n⚠ Interrupted. Some files may be in partial state. Run init again to complete.');
    process.exit(1);
  });

  try {
    const { scaffoldProject, packageSkillIds } = require('../cli/scaffold');
    const changed = scaffoldProject(targetDir);
    console.log(`  ✔ ${projectTnj} (${changed.length} files updated, existing learnings kept)`);

    console.log('\n🐱 Tom n Jerry initialization complete!');
    console.log(`   Project .tnj/ has ${packageSkillIds().length} skills and the index.`);
    console.log('   Hooks for Claude Code, Codex, Hermes, opencode, Pi, Gemini CLI, Antigravity: tomnjerry setup');
    console.log('   opencode (AGENTS.md protocol): tomnjerry install-global, then restart opencode.');
    console.log('   Verify: tomnjerry doctor');

  } catch (error) {
    console.error('✖ Initialization failed:', error.message);
    process.exit(1);
  }
}

// ─── Global AGENTS.md ──────────────────────────────────────────────────────────

function runInstallGlobal() {
  const dir = path.dirname(GLOBAL_AGENTS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let content = '';
  if (fs.existsSync(GLOBAL_AGENTS_PATH)) {
    content = fs.readFileSync(GLOBAL_AGENTS_PATH, 'utf-8');
  }

  if (content.includes('<!-- tnj-global-begin -->')) {
    console.log('✔ TNJ loop protocol already installed in ~/.config/opencode/AGENTS.md');
    console.log('   Restart opencode to pick up changes.');
    return;
  }

  content += '\n' + TNJ_GLOBAL_BLOCK + '\n';
  fs.writeFileSync(GLOBAL_AGENTS_PATH, content);
  console.log('✔ TNJ loop protocol installed in ~/.config/opencode/AGENTS.md');
  console.log('   Restart opencode to activate.');
}

function runRemoveGlobal() {
  if (!fs.existsSync(GLOBAL_AGENTS_PATH)) {
    console.log('ℹ No global AGENTS.md found — nothing to remove.');
    return;
  }

  let content = fs.readFileSync(GLOBAL_AGENTS_PATH, 'utf-8');
  const startMarker = '<!-- tnj-global-begin -->';
  const endMarker = '<!-- tnj-global-end -->';

  if (!content.includes(startMarker)) {
    console.log('ℹ No TNJ block found in AGENTS.md.');
    return;
  }

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker) + endMarker.length;
  content = content.slice(0, startIdx) + content.slice(endIdx);
  content = content.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(GLOBAL_AGENTS_PATH, content);
  console.log('✔ TNJ loop protocol removed from ~/.config/opencode/AGENTS.md');
}

// ─── Check Updates ────────────────────────────────────────────────────────────

function runCheckUpdates() {
  let resolved = false;
  checkLatestVersion().then(latest => {
    resolved = true;
    if (!latest) {
      console.log('ℹ Could not reach npm registry.');
      process.exit(1);
      return;
    }
    const current = PKG.version;
    if (latest === current) {
      console.log(`✔ You're on the latest version: ${current}`);
      process.exit(0);
    } else {
      console.log(`⚠ Update available: ${latest} (installed: ${current})`);
      console.log('  Run: npm install -g @hrshx3o5o6/tomnjerry@latest');
      process.exit(1);
    }
  });
  // Fallback if npm check hangs
  setTimeout(() => {
    if (!resolved) {
      console.log('ℹ npm check timed out.');
      process.exit(1);
    }
  }, 5000);
}

// ─── Help ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Tom n Jerry — Self-improving loop engine for AI coding agents.

Install:
  npm i -g @hrshx3o5o6/tomnjerry && tomnjerry setup

Usage:
  tomnjerry setup [options]    Wire hooks into your agent harnesses and enable this project
      --harness a,b              Pick harnesses (claude, codex, hermes, opencode, pi, gemini, agy); default: detected
      --all                      All supported harnesses
      --project / --no-project   Scaffold .tnj/ here (default: yes inside a repo)
      --project-hooks            Hooks for this project only (default: all projects)
      --mode advise|enforce|off  Jerry mode for this project (default: advise)
      --yes                      No prompts
  tomnjerry remove [--harness a,b] [--purge]   Remove TNJ hooks and skill copies (--purge deletes .tnj/)
  tomnjerry doctor             Diagnostics, including a live run of every installed hook
  tomnjerry stats [--json]     What Jerry, Receipt and Teacher did in this project
  tomnjerry doctor --loop      Show current loop state
  tomnjerry init               Scaffold .tnj/ only (opencode AGENTS.md users)
  tomnjerry install-global     Legacy: loop protocol in ~/.config/opencode/AGENTS.md
  tomnjerry remove-global      Legacy: remove it
  tomnjerry check-updates      Check npm for a newer version
  tomnjerry --help | --version

The Loop:
  Tom (momentum) → Jerry (scan for shortcuts) → receipt (prove it) → Teacher (learn) → loop

Docs: https://github.com/hrshx3o5o6/Tom-n-Jerry
`);
}
