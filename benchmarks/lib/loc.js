// LOC counter — counts lines of code *output* (not markdown prose)
module.exports = function ({ output }) {
  if (!output || typeof output !== 'string') return 0;
  const lines = output.split('\n');
  let inCode = false;
  let loc = 0;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#') && !trimmed.startsWith('/*')) {
        loc++;
      }
    }
  }
  return loc;
};
