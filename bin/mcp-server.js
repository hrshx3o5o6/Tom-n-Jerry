#!/usr/bin/env node
// Tom n Jerry — MCP Server
// Model Context Protocol server over STDIO transport.
// No external dependencies (stdlib only).
//
// Usage:
//   node bin/mcp-server.js
//   # Connect from any MCP client (Claude Desktop, Cursor, opencode)

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, 'templates', 'rules', 'index.json'), 'utf-8'));
const SCANNERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scanners.json'), 'utf-8'));
const RULES_CORE = fs.readFileSync(path.join(ROOT, INDEX.packs.core.file), 'utf-8');

// Load all context pack files
const CONTEXT_PACKS = {};
for (const [name, pack] of Object.entries(INDEX.packs)) {
  if (pack.file) {
    try {
      CONTEXT_PACKS[name] = fs.readFileSync(path.join(ROOT, pack.file), 'utf-8');
    } catch { CONTEXT_PACKS[name] = ''; }
  }
}

// Tool handlers
const TOOLS = {
  scan_task: async (params) => {
    const { task, files, cwd } = params || {};
    if (!task) return { error: { code: -32000, message: 'task required' } };

    // Determine active packs
    const activePacks = ['core'];
    const targetCwd = cwd || process.cwd();
    for (const [name, pack] of Object.entries(INDEX.packs)) {
      if (pack.always) continue;
      for (const rule of (pack.detect || [])) {
        if (rule.file) {
          try {
            const stat = fs.lstatSync(path.join(targetCwd, rule.file));
            if (stat.isFile() || stat.isDirectory()) { activePacks.push(name); break; }
          } catch {}
        }
        if (rule.regex && rule.in) {
          try {
            const content = fs.readFileSync(path.join(targetCwd, rule.in), 'utf-8');
            if (new RegExp(rule.regex).test(content)) { activePacks.push(name); break; }
          } catch {}
        }
      }
    }

    // Find matching scanners
    const matching = SCANNERS.scanners.filter(s =>
      activePacks.includes(s.contextPack)
    );

    // Build context
    const packsContent = activePacks
      .map(name => CONTEXT_PACKS[name])
      .filter(Boolean)
      .join('\n\n');

    return {
      task,
      activePacks,
      matchingScanners: matching.map(s => ({ id: s.id, role: s.role, domains: s.domains })),
      rules: packsContent,
      fileCount: files?.length || 0
    };
  },

  verify_change: async (params) => {
    const { receipt, command } = params || {};
    if (!command && !receipt) return { error: { code: -32000, message: 'command or receipt required' } };

    const childProcess = require('child_process');
    try {
      const result = childProcess.execSync(command || receipt, {
        timeout: 15000,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return {
        success: true,
        stdout: result.substring(0, 2000),
        exitCode: 0
      };
    } catch (err) {
      return {
        success: false,
        stderr: (err.stderr || err.message || '').substring(0, 2000),
        stdout: (err.stdout || '').substring(0, 2000),
        exitCode: err.status || -1
      };
    }
  },

  context_packs: async (params) => {
    const { cwd } = params || {};
    const targetCwd = cwd || process.cwd();
    const active = ['core'];

    for (const [name, pack] of Object.entries(INDEX.packs)) {
      if (pack.always) continue;
      for (const rule of (pack.detect || [])) {
        if (rule.file) {
          try { if (fs.lstatSync(path.join(targetCwd, rule.file)).isFile() || fs.lstatSync(path.join(targetCwd, rule.file)).isDirectory()) { active.push(name); break; } } catch {}
        }
        if (rule.regex && rule.in) {
          try {
            if (new RegExp(rule.regex).test(fs.readFileSync(path.join(targetCwd, rule.in), 'utf-8'))) { active.push(name); break; }
          } catch {}
        }
      }
    }

    return {
      activePacks: [...new Set(active)],
      allPacks: Object.keys(INDEX.packs),
      scanners: SCANNERS.scanners.length,
      version: SCANNERS.version
    };
  }
};

// MCP Protocol: JSON-RPC 2.0 over STDIO
const rl = readline.createInterface({ input: process.stdin });

// Send initialization event
const initMsg = JSON.stringify({
  jsonrpc: '2.0',
  method: 'initialized',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        scan_task: { description: 'Scan task against TNJ rules. Params: task (string), files (string[]), cwd (string). Returns active packs, matching scanners, rules content.' },
        verify_change: { description: 'Verify a change by running a command. Params: command (string) or receipt (string). Returns stdout, stderr, exit code.' },
        context_packs: { description: 'Detect active context packs for a directory. Params: cwd (string). Returns active pack list.' }
      }
    },
    serverInfo: {
      name: 'tomnjerry',
      version: '1.0.0'
    }
  }
});
process.stdout.write(initMsg + '\n');

rl.on('line', (line) => {
  let msg;
  try { msg = JSON.parse(line); }
  catch { return; }

  if (msg.method === 'initialize') {
    const response = {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            scan_task: { description: 'Scan task against TNJ rules. Params: task (string), files (string[]), cwd (string).' },
            verify_change: { description: 'Verify a change by running a command. Params: command (string) or receipt (string).' },
            context_packs: { description: 'Detect active context packs. Params: cwd (string).' }
          }
        },
        serverInfo: { name: 'tomnjerry', version: '1.0.0' }
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  const handler = TOOLS[msg.method];
  if (!handler) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: msg.id,
      error: { code: -32601, message: `Unknown method: ${msg.method}` }
    }) + '\n');
    return;
  }

  handler(msg.params || {}).then(result => {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: msg.id,
      result
    }) + '\n');
  });
});

// Handle parent process exit
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
