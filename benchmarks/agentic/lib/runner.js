// Agentic benchmark runner
// Feeds the model a task + full codebase context. Measures opportunity detection.
//
// Usage: node benchmarks/agentic/lib/runner.js [--arm baseline|tnj-alwayson]

const https = require('https');
const fs = require('fs');
const path = require('path');

const ARMS = {
  baseline: { label: 'baseline (no skill)', system: 'You are an AI coding agent.' },
  'tnj-alwayson': {
    label: 'tom-n-jerry (always-on)',
    system: `You are Tom n Jerry — an opportunistic coding agent.\n\n${(
      fs.readFileSync(path.join(__dirname, '..', '..', '..', 'templates', 'always-on-rules.md'), 'utf-8')
    )}\n\nThe loop: receive intent -> check all affordances above -> emit opportunity card -> implement -> verify receipt.`
  }
};

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }

// Task definitions
const TASKS = [
  {
    id: 'node-express-rate-limit',
    fixture: 'node-express',
    description: 'Add rate limiting to /api/auth/* routes to prevent brute force login attacks. Limit to 5 requests per minute per IP.',
    expectsShortcut: true,
    shortcutType: 'dependency',
    shortcutEvidence: 'express-rate-limit already in package.json'
  },
  {
    id: 'node-express-csv-export',
    fixture: 'node-express',
    description: 'Add a GET /api/users/export endpoint that returns all users as a CSV file download.',
    expectsShortcut: true,
    shortcutType: 'dependency',
    shortcutEvidence: 'json2csv already in package.json'
  },
  {
    id: 'react-dark-mode',
    fixture: 'react-vite',
    description: 'Add a dark mode toggle button to the dashboard. Users should be able to switch between light and dark themes, and the preference should persist across page reloads.',
    expectsShortcut: true,
    shortcutType: 'native',
    shortcutEvidence: 'Tailwind dark mode already configured in tailwind.config.js with darkMode: "class"'
  },
  {
    id: 'react-date-picker',
    fixture: 'react-vite',
    description: 'Add a date range filter to the dashboard. Users should be able to select a start and end date to filter the dashboard data.',
    expectsShortcut: true,
    shortcutType: 'native',
    shortcutEvidence: 'Native <input type="date"> works without any library'
  },
  {
    id: 'node-express-validation',
    fixture: 'node-express',
    description: 'Add input validation middleware for the POST /api/users endpoint. Validate that name and email are required, email format is valid.',
    expectsShortcut: false,
    shortcutType: null,
    shortcutEvidence: null
  }
];

function getFixtureFiles(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = {};
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    const relPath = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      Object.assign(files, getFixtureFiles(fullPath, relPath));
    } else if (e.isFile() && !e.name.startsWith('.')) {
      files[relPath] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
  return files;
}

function callAPI(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 4096,
      temperature: 0.5
    });
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed);
        } catch (e) { reject(new Error(`Parse failed: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function evaluateResponse(task, response) {
  const output = response.choices?.[0]?.message?.content || '';
  const usage = response.usage || {};
  const hasCode = /```/.test(output);
  const newDepsMention = /npm install|pip install|gem install|go get/.test(output);
  const existingCheck = /check|already|existing|package\.json|lockfile|requirements/i.test(output);
  const foundShortcut = task.expectsShortcut
    ? output.toLowerCase().includes(task.shortcutType || 'xxxxx')
    : !newDepsMention;

  const codeBlocks = output.match(/```[\s\S]*?```/g) || [];
  let loc = 0;
  for (const block of codeBlocks) {
    loc += block.split('\n').filter(l => l.trim() && !l.trim().startsWith('```')).length;
  }

  return {
    hasCode,
    loc,
    codeBlocks: codeBlocks.length,
    triedNewInstall: newDepsMention,
    checkedExisting: existingCheck,
    foundShortcut,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    outputPreview: output.slice(0, 200)
  };
}

async function main() {
  const armName = process.argv.find(a => a.startsWith('--arm='))?.split('=')[1]
    || process.argv[process.argv.indexOf('--arm') + 1]
    || 'tnj-alwayson';
  const arm = ARMS[armName];
  if (!arm) { console.error(`Unknown arm: ${armName}. Choose: ${Object.keys(ARMS).join(', ')}`); process.exit(1); }

  console.log(`\n=== Agentic Benchmark: ${arm.label} ===\n`);

  const results = [];

  for (const task of TASKS) {
    console.log(`\n--- Task: ${task.id} ---`);

    const files = getFixtureFiles(path.join(FIXTURES_DIR, task.fixture));
    const codebase = Object.entries(files)
      .map(([p, c]) => `--- ${p} ---\n${c}`)
      .join('\n\n');

    const userMsg = `I am working on a project with this codebase:\n\n${codebase}\n\n---\n\nTask: ${task.description}\n\nImplement the feature. Do not ask clarifying questions.`;

    const messages = [
      { role: 'system', content: arm.system },
      { role: 'user', content: userMsg }
    ];

    try {
      const response = await callAPI(messages);
      const eval_ = evaluateResponse(task, response);
      console.log(`  Has code: ${eval_.hasCode}`);
      console.log(`  LOC: ${eval_.loc}`);
      console.log(`  Code blocks: ${eval_.codeBlocks}`);
      console.log(`  Tried new install: ${eval_.triedNewInstall}`);
      console.log(`  Checked existing: ${eval_.checkedExisting}`);
      console.log(`  Found shortcut: ${eval_.foundShortcut}`);
      console.log(`  Tokens: ${eval_.totalTokens} (${eval_.completionTokens} completion)`);
      console.log(`  Expected shortcut: ${task.expectsShortcut ? task.shortcutType : 'none needed'}`);

      results.push({ task: task.id, arm: arm.label, ...eval_ });
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      results.push({ task: task.id, arm: arm.label, error: err.message });
    }

    // Rate limit buffer
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n\n=== Summary ===');
  console.log(`Arm: ${arm.label}`);
  const completed = results.filter(r => !r.error);
  const withCode = completed.filter(r => r.hasCode).length;
  const shortcutFound = completed.filter(r => r.foundShortcut).length;
  const avgLoc = completed.reduce((s, r) => s + (r.loc || 0), 0) / (completed.length || 1);
  const avgTokens = completed.reduce((s, r) => s + (r.completionTokens || 0), 0) / (completed.length || 1);
  const newInstalls = completed.filter(r => r.triedNewInstall).length;
  const checked = completed.filter(r => r.checkedExisting).length;

  console.log(`  Code produced: ${withCode}/${completed.length}`);
  console.log(`  Shortcut found: ${shortcutFound}/${completed.length}`);
  console.log(`  Checked existing codebase: ${checked}/${completed.length}`);
  console.log(`  Tried new install: ${newInstalls}/${completed.length}`);
  console.log(`  Avg LOC: ${Math.round(avgLoc * 10) / 10}`);
  console.log(`  Avg completion tokens: ${Math.round(avgTokens)}`);

  // Save results
  const resultPath = path.join(__dirname, '..', 'results-agentic.json');
  fs.writeFileSync(resultPath, JSON.stringify({ arm: arm.label, timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nResults saved to ${resultPath}`);
}

main().catch(console.error);
