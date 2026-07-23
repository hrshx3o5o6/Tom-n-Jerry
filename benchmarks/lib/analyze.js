const path = require('path');
const data = require(path.join(__dirname, '..', 'raw-results.json'));
const results = data.results.results;

const arms = {};
for (const r of results) {
  const label = r.prompt.label;
  if (!arms[label]) arms[label] = [];
  const output = r.response?.output || r.response?.text || '';
  const usage = r.response?.tokenUsage || {};
  arms[label].push({
    task: r.vars.task,
    output,
    outputTokens: usage.completion || 0,
    promptTokens: usage.prompt || 0,
    cost: r.response?.cost || 0,
    latencyMs: r.response?.latencyMs || 0
  });
}

for (const [label, entries] of Object.entries(arms)) {
  const n = entries.length;
  const avgOutTokens = Math.round(entries.reduce((s, e) => s + e.outputTokens, 0) / n);
  const avgPromptTokens = Math.round(entries.reduce((s, e) => s + e.promptTokens, 0) / n);
  const avgLatency = Math.round(entries.reduce((s, e) => s + e.latencyMs, 0) / n);
  const totalOutTokens = entries.reduce((s, e) => s + e.outputTokens, 0);
  const avgLines = Math.round(entries.reduce((s, e) => s + e.output.split('\n').length, 0) / n);

  // Count code blocks and LOC
  let totalLoc = 0;
  let codeBlockCount = 0;
  for (const e of entries) {
    const blocks = e.output.match(/```[\s\S]*?```/g) || [];
    codeBlockCount += blocks.length;
    for (const block of blocks) {
      const codeLines = block.split('\n').filter(l => l.trim() && !l.trim().startsWith('```'));
      totalLoc += codeLines.length;
    }
  }
  const avgLoc = Math.round((totalLoc / n) * 10) / 10;
  const avgCodeBlocks = Math.round((codeBlockCount / n) * 10) / 10;

  const hasCode = entries.filter(e => /```/.test(e.output)).length;

  console.log(`=== ${label} ===`);
  console.log(`  Tasks: ${n}`);
  console.log(`  Avg output tokens: ${avgOutTokens}`);
  console.log(`  Avg prompt tokens: ${avgPromptTokens}`);
  console.log(`  Avg latency (ms): ${avgLatency}`);
  console.log(`  Avg total lines: ${avgLines}`);
  console.log(`  Avg code LOC: ${avgLoc}`);
  console.log(`  Avg code blocks: ${avgCodeBlocks}`);
  console.log(`  Tasks with code: ${hasCode}/${n}`);
  console.log(`  Total output tokens: ${totalOutTokens}`);
  console.log();
}

// Compute deltas vs baseline
console.log('=== Deltas vs Baseline ===');
const baseline = arms['baseline (no skill)'];
if (baseline) {
  const bTok = baseline.reduce((s, e) => s + e.outputTokens, 0) / baseline.length;
  const bLoc = baseline.reduce((s, e) => {
    const blocks = e.output.match(/```[\s\S]*?```/g) || [];
    return s + blocks.reduce((sum, b) => sum + b.split('\n').filter(l => l.trim() && !l.trim().startsWith('```')).length, 0);
  }, 0) / baseline.length;

  for (const [label, entries] of Object.entries(arms)) {
    if (label === 'baseline (no skill)') continue;
    const aTok = entries.reduce((s, e) => s + e.outputTokens, 0) / entries.length;
    const aLoc = entries.reduce((s, e) => {
      const blocks = e.output.match(/```[\s\S]*?```/g) || [];
      return s + blocks.reduce((sum, b) => sum + b.split('\n').filter(l => l.trim() && !l.trim().startsWith('```')).length, 0);
    }, 0) / entries.length;
    const tokDelta = Math.round(((aTok - bTok) / bTok) * 100);
    const locDelta = Math.round(((aLoc - bLoc) / bLoc) * 100);
    console.log(`  ${label}: tokens ${tokDelta > 0 ? '+' : ''}${tokDelta}%, LOC ${locDelta > 0 ? '+' : ''}${locDelta}%`);
  }
}
