#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const PKG = require('../package.json');
const SOURCE_DIR = path.join(__dirname, '..');
const SKILLS_DIR = path.join(SOURCE_DIR, 'skills');
const TEMPLATES_DIR = path.join(SOURCE_DIR, 'templates');

const REQUIRED_SKILLS = [
  'tom-core', 'jerry-core', 'receipt-jerry', 'browser-jerry',
  'framework-jerry', 'dependency-jerry', 'db-jerry', 'api-jerry',
  'git-jerry', 'delete-jerry', 'unix-jerry', 'trap-jerry',
  'test-jerry', 'tomnjerry'
];

const REQUIRED_TEMPLATES = [
  '.cursorrules', 'claudeproj.md', 'opencode.json',
  'tomnjerry-combined.rules', 'always-on-rules.md'
];

const command = process.argv[2];

switch (command) {
  case 'doctor':
    runDoctor();
    break;
  case 'init':
  case undefined:
    runInit();
    break;
  case 'mcp-server':
    require('./mcp-server');
    break;
  case 'detect':
    require('./detect-stack');
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
    console.error('Usage: npx @hrshx3o5o6/tomnjerry [init|doctor|mcp-server|detect|--help|--version]');
    process.exit(1);
}

// ─── Doctor ────────────────────────────────────────────────────────────────────

function runDoctor() {
  console.log('🐭 Tom n Jerry — Diagnostic Report\n');
  let allPassed = true;

  // Version
  console.log(`Version: ${PKG.version}`);
  checkLatestVersion().then(latest => {
    if (latest && latest !== PKG.version) {
      console.warn(`  ⚠ Update available: ${latest} (installed: ${PKG.version})`);
    }
  });

  // Skills check
  console.log(`\nSkills (${REQUIRED_SKILLS.length} required):`);
  REQUIRED_SKILLS.forEach(name => {
    const filePath = path.join(SKILLS_DIR, name, 'SKILL.md');
    if (!fs.existsSync(filePath)) {
      console.error(`  ✖ Missing: ${name}/SKILL.md`);
      allPassed = false;
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.startsWith('---')) {
      console.warn(`  ⚠ ${name}/SKILL.md — missing YAML frontmatter`);
    } else {
      console.log(`  ✔ ${name}`);
    }
  });

  // Coordinator routing check
  const coordPath = path.join(SKILLS_DIR, 'tomnjerry', 'SKILL.md');
  if (fs.existsSync(coordPath)) {
    const coordContent = fs.readFileSync(coordPath, 'utf-8');
    const mentioned = [];
    REQUIRED_SKILLS.forEach(name => {
      if (name !== 'tomnjerry' && name !== 'receipt-jerry'
          && name !== 'tom-core' && name !== 'jerry-core') {
        if (coordContent.includes(name)) mentioned.push(name);
      }
    });
    const orphans = ['delete-jerry', 'test-jerry', 'framework-jerry'].filter(
      name => !coordContent.includes(name)
    );
    if (orphans.length > 0) {
      console.warn(`  ⚠ Coordinator missing: ${orphans.join(', ')}`);
      allPassed = false;
    } else {
      console.log('  ✔ Coordinator routing complete');
    }
  }

  // Scanners registry check
  const scannersPath = path.join(SOURCE_DIR, 'scanners.json');
  if (fs.existsSync(scannersPath)) {
    const scanners = JSON.parse(fs.readFileSync(scannersPath, 'utf-8'));
    const scannerIds = scanners.scanners.map(s => s.id);
    const missing = REQUIRED_SKILLS.filter(s => !scannerIds.includes(s));
    if (missing.length > 0) {
      console.log(`  ⚠ scanners.json missing: ${missing.join(', ')}`);
      allPassed = false;
    } else {
      console.log('  ✔ scanners.json: all 14 scanners registered');
    }
  }

  // Context pack detection + mode
  const { detect, getMode } = require('./detect-stack');
  const detected = detect();
  const mode = getMode();
  console.log(`  ℹ Context packs active: ${detected.join(', ')}`);
  console.log(`  ℹ Output mode: ${mode}`);
  console.log('  ✔ MCP server: bin/mcp-server.js');

  // Templates check
  console.log(`\nTemplates:`);
  REQUIRED_TEMPLATES.forEach(name => {
    const tpl = path.join(TEMPLATES_DIR, name);
    if (fs.existsSync(tpl)) {
      console.log(`  ✔ ${name}`);
    } else {
      console.warn(`  ⚠ Missing: ${name}`);
      allPassed = false;
    }
  });

  // Check init state (if skills exist in target)
  const targetDir = process.cwd();
  const skillsTarget = path.join(targetDir, 'skills');
  if (fs.existsSync(skillsTarget)) {
    const installed = fs.readdirSync(skillsTarget)
      .filter(f => fs.lstatSync(path.join(skillsTarget, f)).isDirectory());
    console.log(`\nInstallation status: ${installed.length} skill directories in project already`);
  } else {
    console.log('\nInstallation status: not yet initialized in this directory');
  }

  console.log(allPassed ? '\n✔ All checks passed.' : '\n⚠ Some checks failed. Re-run `init` to fix.');
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

  console.log('🐭 Tom n Jerry: Starting preflight configuration...\n');

  const visited = new Set();

  function copyFolderSync(from, to) {
    const realFrom = fs.realpathSync(from);
    if (visited.has(realFrom)) {
      console.warn(`  ⚠ Skipping circular symlink: ${from}`);
      return;
    }
    visited.add(realFrom);

    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true });
    }
    fs.readdirSync(from).forEach((element) => {
      const srcPath = path.join(from, element);
      const destPath = path.join(to, element);
      let stat;
      try {
        stat = fs.lstatSync(srcPath);
      } catch (err) {
        console.warn(`  ⚠ Skipping unreadable entry: ${srcPath} (${err.code})`);
        return;
      }
      if (stat.isSymbolicLink()) {
        const linkTarget = fs.readlinkSync(srcPath);
        try {
          fs.symlinkSync(linkTarget, destPath);
        } catch (err) {
          console.warn(`  ⚠ Could not copy symlink ${srcPath} -> ${destPath} (${err.code})`);
        }
      } else if (stat.isFile()) {
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (err) {
          console.warn(`  ⚠ Failed to copy ${srcPath} -> ${destPath} (${err.code})`);
          throw err;
        }
      } else if (stat.isDirectory()) {
        copyFolderSync(srcPath, destPath);
      }
    });
  }

  let interrupted = false;

  process.on('SIGINT', () => {
    if (interrupted) {
      console.error('\n✖ Force exiting.');
      process.exit(1);
    }
    interrupted = true;
    console.error('\n⚠ Interrupted. Some files may be in partial state. Run the command again to complete.');
    process.exit(1);
  });

  function fileExists(target) {
    try { return fs.existsSync(target); }
    catch { return false; }
  }

  function copyWithOverwriteCheck(src, dest, label) {
    if (fileExists(dest)) {
      console.warn(`  ⚠ ${label} already exists at ${dest} — skipping (use --force to overwrite)`);
      return false;
    }
    if (!fileExists(src)) {
      console.warn(`  ⚠ ${label} source not found at ${src} — skipping`);
      return false;
    }
    fs.copyFileSync(src, dest);
    return true;
  }

  try {
    // Copy skills directory
    const skillsSource = path.join(SOURCE_DIR, 'skills');
    const skillsTarget = path.join(targetDir, 'skills');

    if (fs.existsSync(skillsSource)) {
      console.log('-> Copying skills folder...');
      copyFolderSync(skillsSource, skillsTarget);
      console.log('✔ Skills copied successfully.');
    } else {
      console.error('✖ Source skills directory not found.');
      process.exit(1);
    }

    // Always-on rules
    copyWithOverwriteCheck(
      path.join(TEMPLATES_DIR, 'always-on-rules.md'),
      path.join(targetDir, 'always-on-rules.md'),
      'always-on-rules.md'
    );

    // Harness Auto-Detection
    console.log('\n-> Detecting agent environments...');

    let detected = false;

    if (copyWithOverwriteCheck(
      path.join(TEMPLATES_DIR, '.cursorrules'),
      path.join(targetDir, '.cursorrules'),
      '.cursorrules'
    )) {
      console.log('✔ Cursor environment detected. Created .cursorrules in root.');
      detected = true;
    }

    if (copyWithOverwriteCheck(
      path.join(TEMPLATES_DIR, 'claudeproj.md'),
      path.join(targetDir, 'claudeproj.md'),
      'claudeproj.md'
    )) {
      console.log('✔ Claude Code project template created as claudeproj.md.');
      detected = true;
    }

    if (copyWithOverwriteCheck(
      path.join(TEMPLATES_DIR, 'opencode.json'),
      path.join(targetDir, 'opencode.json'),
      'opencode.json'
    )) {
      console.log('✔ opencode project config created as opencode.json.');
      detected = true;
    }

    if (!detected) {
      console.log('ℹ No specific harness configuration files generated. Standard skills are ready.');
      console.log('ℹ For always-on mode, inject templates/always-on-rules.md into your agent\'s system prompt.');
    }

    console.log('\n🐱 Tom n Jerry initialization complete! Run "/tomnjerry" inside your agent chat to scan your workspace.');
    console.log('   Verify: run "npx @hrshx3o5o6/tomnjerry doctor" to check the installation.');
    console.log('   Always-on: inject always-on-rules.md into your agent\'s system prompt for best results.');

  } catch (error) {
    console.error('✖ Initialization failed:', error.message);
    if (error.stack) {
      console.error('  Location:', error.stack.split('\n').slice(1, 2).join('').trim());
    }
    process.exit(1);
  }
}

// ─── Help ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Tom n Jerry — Opportunistic engineering skill pack for AI coding agents.

Usage:
  npx @hrshx3o5o6/tomnjerry init         Initialize skills in the current project (default)
  npx @hrshx3o5o6/tomnjerry doctor        Run diagnostic checks
  npx @hrshx3o5o6/tomnjerry mcp-server    Start MCP server (STDIO transport)
  npx @hrshx3o5o6/tomnjerry detect        Detect active context packs
  npx @hrshx3o5o6/tomnjerry --help        Show this message
  npx @hrshx3o5o6/tomnjerry --version     Show version

Modes:
  TNJ_MODE=ponytail  Switch to terse one-liner output (Ponytail compat)

Context packs (auto-detected from CWD):
  core — always inject  |  frontend — browser/CSS/React APIs
  backend — framework/API/DB  |  shell — unix tools/pipeline

Docs: https://github.com/hrshx3o5o6/Tom-n-Jerry
`);
}
