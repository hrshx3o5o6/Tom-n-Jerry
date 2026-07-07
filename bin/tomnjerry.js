#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const sourceDir = path.join(__dirname, '..');

console.log('🐭 Tom n Jerry: Starting preflight configuration...\n');

// 1. Helper function to copy directories recursively
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

try {
  // 2. Copy the skills directory
  const skillsSource = path.join(sourceDir, 'skills');
  const skillsTarget = path.join(targetDir, 'skills');
  
  if (fs.existsSync(skillsSource)) {
    console.log('-> Copying skills folder...');
    copyFolderSync(skillsSource, skillsTarget);
    console.log('✔ Skills copied successfully.');
  } else {
    console.error('✖ Source skills directory not found.');
    process.exit(1);
  }

  // 3. Harness Auto-Detection
  console.log('\n-> Detecting agent environments...');
  
  let detected = false;

  // Check Cursor
  if (fs.existsSync(path.join(targetDir, '.git')) || fs.existsSync(skillsTarget)) {
    const cursorRulesSource = path.join(sourceDir, 'templates', '.cursorrules');
    const cursorRulesTarget = path.join(targetDir, '.cursorrules');
    if (fs.existsSync(cursorRulesSource)) {
      fs.copyFileSync(cursorRulesSource, cursorRulesTarget);
      console.log('✔ Cursor environment detected. Created .cursorrules in root.');
      detected = true;
    }
  }

  // Check Claude Code
  const claudeprojSource = path.join(sourceDir, 'templates', 'claudeproj.md');
  const claudeprojTarget = path.join(targetDir, 'claudeproj.md');
  if (fs.existsSync(claudeprojSource)) {
    fs.copyFileSync(claudeprojSource, claudeprojTarget);
    console.log('✔ Claude Code project template created as claudeproj.md.');
    detected = true;
  }

  // Check opencode
  const opencodeSource = path.join(sourceDir, 'templates', 'opencode.json');
  const opencodeTarget = path.join(targetDir, 'opencode.json');
  if (fs.existsSync(opencodeSource)) {
    fs.copyFileSync(opencodeSource, opencodeTarget);
    console.log('✔ opencode project config created as opencode.json.');
    detected = true;
  }

  if (!detected) {
    console.log('ℹ No specific harness configuration files generated. Standard skills are ready.');
  }

  console.log('\n🐱 Tom n Jerry initialization complete! Run "/tomnjerry" inside your agent chat to scan your workspace.');

} catch (error) {
  console.error('✖ Initialization failed:', error.message);
  process.exit(1);
}
