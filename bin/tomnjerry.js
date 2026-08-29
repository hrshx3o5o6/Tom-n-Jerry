#!/usr/bin/env node

const fs = require('fs');
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

const GLOBAL_AGENTS_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.config', 'opencode', 'AGENTS.md'
);

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
- If \`path\` starts with \`skills/\` → read \`.tnj/skills/<skill>.md\`
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
    "path": "skills/name.md",
    "type": "generic|custom"
  }]
}
\`\`\`

## Skill Creation Rules

- Save only patterns that apply to 2+ future tasks.
- Be concise: 5-15 lines. Include trigger condition, checks, example.
- File name: lowercase-hyphens.md
- Append entry to \`.tnj/index.json\` after writing.
- Skills in \`.tnj/learnings/\` with 2+ successful retrievals → promote to \`.tnj/skills/\` by updating index.json path.

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

switch (command) {
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
    console.error('Usage: npx @hrshx3o5o6/tomnjerry [init|doctor|check-updates|install-global|remove-global|--help|--version]');
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
    const filePath = path.join(TNJ_DIR, 'skills', `${name}.md`);
    if (!fs.existsSync(filePath)) {
      console.error(`  ✖ Missing: skills/${name}.md`);
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
    console.log(`\nProject status: not initialized (run tnj init in project)`);
  }

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
    // Copy tnj/ directory to project
    if (fs.existsSync(path.join(TNJ_DIR, 'skills'))) {
      console.log('-> Creating .tnj/ directory with skills...');

      if (!fs.existsSync(projectTnj)) {
        fs.mkdirSync(projectTnj, { recursive: true });
      }

      // Copy index.json
      const srcIndex = path.join(TNJ_DIR, 'index.json');
      const destIndex = path.join(projectTnj, 'index.json');
      if (fs.existsSync(srcIndex)) {
        fs.copyFileSync(srcIndex, destIndex);
        console.log('  ✔ Copied index.json');
      }

      // Copy skills/
      const srcSkills = path.join(TNJ_DIR, 'skills');
      const destSkills = path.join(projectTnj, 'skills');
      if (fs.existsSync(srcSkills)) {
        copyDirRecursive(srcSkills, destSkills);
        const skillFiles = fs.readdirSync(destSkills).length;
        console.log(`  ✔ Copied ${skillFiles} skill files`);
      }

      // Create learnings/
      const destLearnings = path.join(projectTnj, 'learnings');
      if (!fs.existsSync(destLearnings)) {
        fs.mkdirSync(destLearnings, { recursive: true });
        fs.writeFileSync(path.join(destLearnings, '.gitkeep'), '');
      }
      console.log('  ✔ Created learnings/ directory');
    }

    console.log('\n🐱 Tom n Jerry initialization complete!');
    console.log('   Project .tnj/ created with 13 skill files and index.');
    console.log('   Restart opencode to pick up the new AGENTS.md loop protocol.');
    console.log('   Verify: npx @hrshx3o5o6/tomnjerry doctor');

  } catch (error) {
    console.error('✖ Initialization failed:', error.message);
    process.exit(1);
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.lstatSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
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

Usage:
  npx @hrshx3o5o6/tomnjerry init              Initialize .tnj/ in project (skills + index)
  npx @hrshx3o5o6/tomnjerry doctor             Run diagnostic checks
  npx @hrshx3o5o6/tomnjerry doctor --loop      Show current loop state
  npx @hrshx3o5o6/tomnjerry check-updates      Check npm for newer version
  npx @hrshx3o5o6/tomnjerry install-global     Install loop protocol to ~/.config/opencode/AGENTS.md
  npx @hrshx3o5o6/tomnjerry remove-global      Remove loop protocol from AGENTS.md
  npx @hrshx3o5o6/tomnjerry --help             Show this message
  npx @hrshx3o5o6/tomnjerry --version         Show version

Setup:
  1. install-global  — makes TNJ fire in every opencode session
  2. init            — creates .tnj/ in your project (skills + learnings)
  3. restart opencode — pick up the loop protocol

The Loop:
  Tom (momentum) → Jerry (scan for shortcuts) → receipt (prove it) → Teacher (learn) → loop

Docs: https://github.com/hrshx3o5o6/Tom-n-Jerry
`);
}
