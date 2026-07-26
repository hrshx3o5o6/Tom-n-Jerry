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

## The Loop

Every user request runs: Tom → Jerry → (card or implement) → receipt → Teacher → loop

### 1. Tom (Momentum)
Propose ONE concrete next action. Be specific.
"I'll add express-rate-limit middleware to /api/auth routes."
State the receipt: "I'll prove it worked by running curl -I /api/auth/login."

### 2. Jerry (Street Smarts)
Read \`.tnj/index.json\`. Match the current task intent + tech stack to skill keywords.
For each matching skill: read \`.tnj/skills/<skill>.md\`, run its checks.
- If a shortcut exists → emit Opportunity Card → Tom implements the shortcut.
- If no shortcut → Tom implements directly.

### 3. Receipt (Proof)
After every implementation step, run the receipt command.
Capture stdout, stderr, exit code. Compare against expected.
If mismatch → diagnose and fix. If pass → confirm and proceed.

### 4. Teacher (Learning)
After completing a full task (not each step), reflect:
- Did we discover a non-obvious pattern worth remembering?
- Would this apply to 2+ future tasks?
If yes → write \`.tnj/learnings/<topic>.md\` (concise, 5-15 lines).
Then append the new skill entry to \`.tnj/index.json\`.

### 5. Loop
After receipt → loop back to Tom for next step.
After Teacher → stay on current task or move to next.

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

- Tom without Jerry = overbuilding. Always scan before implementing.
- Jerry without Tom = analysis paralysis. Always implement after scanning.
- Receipt without a command = "it built" ≠ it works. Always run verification.
- Learning without a trigger = noise. Only save genuine patterns.
<!-- tnj-global-end -->
`;

const command = process.argv[2];

switch (command) {
  case 'doctor':
    runDoctor();
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
    console.error('Usage: npx @hrshx3o5o6/tomnjerry [init|doctor|install-global|remove-global|--help|--version]');
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

// ─── Help ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Tom n Jerry — Self-improving loop engine for AI coding agents.

Usage:
  npx @hrshx3o5o6/tomnjerry init              Initialize .tnj/ in project (skills + index)
  npx @hrshx3o5o6/tomnjerry doctor             Run diagnostic checks
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
