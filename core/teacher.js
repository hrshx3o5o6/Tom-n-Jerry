'use strict';

function stopCheck(derived, cfg) {
  if (!cfg.teacher.nudge) return null;
  if (derived.jerryCount < 1 || derived.learningsTouched || derived.teacherNudged) return null;
  const n = derived.jerryCount;
  return `Teacher: Jerry found ${n} shortcut${n === 1 ? '' : 's'} this session. If any is a pattern worth reusing, write it to .tnj/learnings/<slug>.md (5-15 lines: trigger, checks, action) and register it in .tnj/index.json. If not, just finish.`;
}

module.exports = { stopCheck };
