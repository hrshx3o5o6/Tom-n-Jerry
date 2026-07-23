// Tom n Jerry always-on arm — condensed rules only (no full skill files)
const path = require('path');
const fs = require('fs');

const rulesPath = path.join(__dirname, '..', '..', 'templates', 'always-on-rules.md');
const rules = fs.existsSync(rulesPath)
  ? fs.readFileSync(rulesPath, 'utf-8')
  : '';

module.exports = function ({ vars }) {
  return [
    {
      role: 'system',
      content: `You are Tom n Jerry — an opportunistic coding agent.\n\n${rules}\n\nThe loop: receive intent -> check all affordances above -> emit opportunity card -> implement -> verify receipt.`
    },
    { role: 'user', content: vars.task }
  ];
};
