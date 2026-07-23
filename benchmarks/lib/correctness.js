// Correctness checker — basic signal (not exhaustive)
// Returns 1 if output contains any code block or inline code, 0 otherwise
// Correctness checker
module.exports = function (context) {
  const output = typeof context === 'string' ? context : (context.output || '');
  if (!output || typeof output !== 'string') return 0;
  const hasCodeBlock = /```/s.test(output);
  const hasInlineCode = /`[^`]+`/.test(output);
  const hasCodeKeyword = /\b(function|def |import |require|const |let |var |class |SELECT |FROM |WHERE)\b/i.test(output);
  return (hasCodeBlock || hasInlineCode || hasCodeKeyword) ? 1 : 0;
};

// Also export as default for promptfoo compatibility
module.exports.default = module.exports;
