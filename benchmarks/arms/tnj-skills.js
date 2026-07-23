// Tom n Jerry arm — injects condensed skill instructions
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
      content: `You are an AI coding agent with Tom n Jerry rules enabled.\n\n${rules}\n\nFollow these rules for every task.`
    },
    { role: 'user', content: vars.task }
  ];
};
