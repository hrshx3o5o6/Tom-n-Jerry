// Compare baseline vs TNJ results
// node benchmarks/agentic/lib/compare.js

const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '..');
const baselineFile = path.join(resultsDir, 'results-agentic-baseline.json');
const tnjFile = path.join(resultsDir, 'results-agentic-tnj.json');

if (!fs.existsSync(baselineFile) || !fs.existsSync(tnjFile)) {
  console.error('Run both arms first:');
  console.error('  node benchmarks/agentic/lib/runner.js --arm baseline');
  console.error('  node benchmarks/agentic/lib/runner.js --arm tnj-alwayson');
  console.error(`  Missing: ${!fs.existsSync(baselineFile) ? baselineFile + ' ' : ''}${!fs.existsSync(tnjFile) ? tnjFile : ''}`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf-8'));
const tnj = JSON.parse(fs.readFileSync(tnjFile, 'utf-8'));

const bResults = baseline.results.filter(r => !r.error);
const tResults = tnj.results.filter(r => !r.error);

console.log('=== Agentic Benchmark: Baseline vs Tom n Jerry ===\n');

const table = [
  ['Metric', 'Baseline', 'TNJ Always-On', 'Delta'].join(' | ')
];
table.push(['-' .repeat(10), '-' .repeat(10), '-' .repeat(15), '-' .repeat(10)].join('|'));

function avg(arr, key) {
  return Math.round(arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length * 10) / 10;
}

function pct(a, b) {
  if (b === 0) return 'N/A';
  const d = Math.round(((a - b) / b) * 100);
  return `${d > 0 ? '+' : ''}${d}%`;
}

const metrics = [
  ['Code produced', bResults.filter(r => r.hasCode).length + '/' + bResults.length, tResults.filter(r => r.hasCode).length + '/' + tResults.length, '—'],
  ['Shortcut detected', bResults.filter(r => r.foundShortcut).length + '/' + bResults.length, tResults.filter(r => r.foundShortcut).length + '/' + tResults.length, '—'],
  ['Checked existing code', bResults.filter(r => r.checkedExisting).length + '/' + bResults.length, tResults.filter(r => r.checkedExisting).length + '/' + tResults.length, '—'],
  ['Tried new install', bResults.filter(r => r.triedNewInstall).length + '/' + bResults.length, tResults.filter(r => r.triedNewInstall).length + '/' + tResults.length, '—'],
  ['Avg LOC', avg(bResults, 'loc'), avg(tResults, 'loc'), pct(avg(tResults, 'loc'), avg(bResults, 'loc'))],
  ['Avg code blocks', avg(bResults, 'codeBlocks'), avg(tResults, 'codeBlocks'), pct(avg(tResults, 'codeBlocks'), avg(bResults, 'codeBlocks'))],
  ['Avg completion tokens', avg(bResults, 'completionTokens'), avg(tResults, 'completionTokens'), pct(avg(tResults, 'completionTokens'), avg(bResults, 'completionTokens'))],
];

for (const row of metrics) {
  table.push(row.join(' | '));
}

console.log(table.join('\n'));

// Per-task comparison
console.log('\n\n=== Per-Task Breakdown ===\n');
for (const bR of bResults) {
  const tR = tResults.find(r => r.task === bR.task);
  if (!tR) continue;
  console.log(`Task: ${bR.task}`);
  console.log(`  Baseline: LOC=${bR.loc}, shortcut=${bR.foundShortcut}, newInstall=${bR.triedNewInstall}`);
  console.log(`  TNJ:      LOC=${tR.loc}, shortcut=${tR.foundShortcut}, newInstall=${tR.triedNewInstall}`);
  console.log(`  Delta:    LOC ${pct(tR.loc, bR.loc)}, shortcut ${tR.foundShortcut !== bR.foundShortcut ? 'CHANGED' : 'same'}`);
  console.log();
}
