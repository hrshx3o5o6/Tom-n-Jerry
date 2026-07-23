# Agentic Benchmark

Tests Tom n Jerry's core value prop: opportunity detection in multi-turn agentic workflows.

## Methodology

Each task gives the agent a realistic repo with existing code, dependencies, git history, and framework config. The agent must add a feature. We measure:

| Metric | How |
|---|---|
| **Lib reuse** | Did agent check `package.json`/lockfile before installing? |
| **Pattern reuse** | Did agent follow existing code patterns? |
| **LOC delta** | Code added vs naive approach (from reference solution) |
| **New deps** | Number of new dependencies installed |
| **File count** | New files created vs modified |
| **Plan-to-code ratio** | Did agent produce code or just plans? |
| **Correctness** | Does the solution build/pass? |

## Tasks

| # | Repo | Feature | Built-in shortcut |
|---|---|---|---|
| 1 | node-express | Rate limiter on auth routes | `express-rate-limit` already in lockfile |
| 2 | react-vite | Dark mode toggle | Tailwind `dark:` classes already configured |
| 3 | python-django | API endpoint for search | `django-filter` already in requirements.txt |
| 4 | node-express | CSV export endpoint | `json2csv` already in lockfile |
| 5 | react-vite | Date picker form field | Native `<input type="date">` works |

## Running

```bash
# Baseline (no skill)
node benchmarks/agentic/lib/runner.js --arm baseline

# Tom n Jerry
node benchmarks/agentic/lib/runner.js --arm tnj-alwayson

# Compare results
node benchmarks/agentic/lib/compare.js
```
