// Baseline arm — no skill, pure model response
module.exports = function ({ vars }) {
  return [
    { role: 'user', content: vars.task }
  ];
};
