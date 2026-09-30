'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { findRoot, resolveSessionId, rotateSession } = require('./root');
const session = require('./session');
const { loadConfig } = require('./config');
const jerry = require('./jerry');
const receipt = require('./receipt');
const teacher = require('./teacher');
const tom = require('./tom');

const BUDGET_MS = 1500;

class OverBudget extends Error {}

function clip(s, n) {
  s = s == null ? '' : String(s);
  return s.length > n ? s.slice(0, n) : s;
}

function tail(s, n) {
  s = s == null ? '' : String(s);
  return s.length > n ? s.slice(-n) : s;
}

function logError(tnjDir, err) {
  try {
    if (tnjDir && fs.existsSync(tnjDir)) {
      session.appendLine(path.join(tnjDir, 'errors.log'), { t: Date.now(), error: clip(err && err.stack || err, 2000) });
    }
  } catch {}
}

function onSessionStart(ctx) {
  const { input, tnjDir } = ctx;
  if (!input.sessionId) rotateSession(tnjDir);
  session.cleanup(tnjDir);
  return { context: tom.turnContext(tnjDir, '', { full: true }) };
}

function onPrompt(ctx) {
  const { input, tnjDir, sid } = ctx;
  session.append(tnjDir, sid, { e: 'prompt' });
  ctx.check();
  const d = session.derive(session.read(tnjDir, sid));
  const full = Boolean(input.systemInjection) || (input.capabilities && input.capabilities.sessionStart === false && d.turn === 1);
  const findings = d.undelivered;
  if (findings.length) session.append(tnjDir, sid, { e: 'delivered', ids: findings.map(f => f.id) });
  return { context: tom.turnContext(tnjDir, input.prompt || '', { full, findings }) };
}

function onToolBefore(ctx) {
  const { input, tnjDir, sid, root, cfg } = ctx;
  const tool = input.tool || {};
  if (tool.kind !== 'shell' || !tool.command) return {};
  const findings = jerry.inspect(root, input.cwd, tool.command, cfg);
  ctx.check();
  if (findings.length === 0) return {};

  const blocking = cfg.mode === 'enforce' ? findings.filter(f => f.kind === 'present' && f.direct) : [];
  const advisory = findings.filter(f => !blocking.includes(f));
  const canInject = !(input.capabilities && input.capabilities.toolContext === false);

  for (const f of findings) {
    session.append(tnjDir, sid, {
      e: 'jerry', id: crypto.randomBytes(4).toString('hex'), pkg: f.pkg, kind: f.kind,
      where: f.where, msg: f.message, blocked: blocking.includes(f),
      delivered: blocking.includes(f) || canInject,
    });
  }

  const out = {};
  if (blocking.length) {
    out.block = { reason: `[Tom n Jerry] Jerry blocked this install (enforce mode). ${findings.map(f => f.message).join(' ')}` };
  } else if (canInject) {
    out.context = `[Tom n Jerry] Jerry: ${advisory.map(f => f.message).join(' ')}`;
  }
  return out;
}

function onToolAfter(ctx) {
  const { input, tnjDir, sid, root } = ctx;
  const tool = input.tool || {};
  const result = input.result || {};

  if (tool.kind === 'shell' && tool.command) {
    const exit = Number.isInteger(result.exitCode) ? result.exitCode : null;
    session.appendLine(path.join(tnjDir, 'receipts.jsonl'), {
      ts: new Date().toISOString(), session: sid, harness: input.harness,
      cmd: clip(tool.command, 1000), exit, out: tail(result.output, 500),
    });
    session.append(tnjDir, sid, { e: 'shell', cmd: clip(tool.command, 300), exit, verify: receipt.isVerification(tool.command) });
    if (receipt.mentionsLearnings(tool.command)) session.append(tnjDir, sid, { e: 'learning', path: 'shell' });
  } else if (tool.kind === 'edit') {
    const base = input.cwd || root;
    for (const p of tool.paths || []) {
      const kind = receipt.classifyPath(root, path.resolve(base, p));
      if (kind) session.append(tnjDir, sid, { e: kind, path: clip(path.relative(root, path.resolve(base, p)), 300) });
    }
  }

  if (input.capabilities && input.capabilities.deliverAfterTool) {
    ctx.check();
    const d = session.derive(session.read(tnjDir, sid));
    if (d.undelivered.length) {
      session.append(tnjDir, sid, { e: 'delivered', ids: d.undelivered.map(f => f.id) });
      return { context: `[Tom n Jerry] Jerry: ${d.undelivered.map(f => f.msg).join(' ')}` };
    }
  }
  return {};
}

function onStop(ctx) {
  const { input, tnjDir, sid, cfg } = ctx;
  if (input.stopHookActive) return {};
  const d = session.derive(session.read(tnjDir, sid));
  ctx.check();
  if (d.continuesThisTurn >= 1) return {};
  let kind = 'receipt';
  let reason = receipt.stopCheck(d, cfg);
  if (!reason) {
    kind = 'teacher';
    reason = teacher.stopCheck(d, cfg);
  }
  if (!reason) return {};
  session.append(tnjDir, sid, { e: 'nudge', kind });
  return { continue: { reason: `[Tom n Jerry] ${reason}` } };
}

const HANDLERS = {
  sessionStart: onSessionStart,
  prompt: onPrompt,
  toolBefore: onToolBefore,
  toolAfter: onToolAfter,
  stop: onStop,
};

// Never throws. Any failure or budget overrun yields an empty decision so a TNJ
// bug can never block or break the host agent.
function handle(input, env = process.env) {
  const started = Date.now();
  let tnjDir = null;
  try {
    const handler = HANDLERS[input && input.event];
    if (!handler) return {};
    const root = findRoot(input.cwd || process.cwd(), env);
    tnjDir = path.join(root, '.tnj');
    if (!fs.existsSync(tnjDir)) {
      return input.event === 'sessionStart' ? { context: tom.NO_TNJ_NOTICE } : {};
    }
    const cfg = loadConfig(root);
    if (cfg.mode === 'off') return {};
    const ctx = {
      input, root, tnjDir, cfg,
      sid: resolveSessionId(input.sessionId, tnjDir),
      check() { if (Date.now() - started > BUDGET_MS) throw new OverBudget('budget exceeded'); },
    };
    return handler(ctx) || {};
  } catch (err) {
    if (!(err instanceof OverBudget)) logError(tnjDir, err);
    return {};
  }
}

module.exports = { handle, BUDGET_MS };
