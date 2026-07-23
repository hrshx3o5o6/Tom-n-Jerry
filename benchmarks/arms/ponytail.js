// Ponytail arm — injects ponytail rules if available
// Install: npm install @dietrichgebert/ponytail
module.exports = function ({ vars }) {
  let rules = '';
  try {
    const pkg = require('@dietrichgebert/ponytail/package.json');
    const rulesPath = require.resolve('@dietrichgebert/ponytail/AGENTS.md');
    const fs = require('fs');
    rules = fs.readFileSync(rulesPath, 'utf-8');
  } catch {
    rules = 'Write the minimum viable code. Check for existing solutions first. Use standard library before dependencies. One line over fifty.';
  }

  return [
    {
      role: 'system',
      content: `You are ponytail — the laziest senior dev.\n\n${rules}\n\nHe says nothing. He writes one line. It works.`
    },
    { role: 'user', content: vars.task }
  ];
};
