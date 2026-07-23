# Benchmark Results

**Date:** 2026-07-23
**Model:** gpt-4o-mini (OpenAI)
**Tasks:** 10 single-shot code generation prompts
**Arms:** baseline, ponytail, tom-n-jerry (skills), tom-n-jerry (always-on)

## Summary

| Metric | Baseline | Ponytail | TNJ Skills | TNJ Always-On |
|---|---|---|---|---|
| Avg output tokens | 587 | **134** (−77%) | 459 (−22%) | 494 (−16%) |
| Avg prompt tokens | 24 | 75 | **1209** | **1222** |
| Avg code LOC | 35.1 | **9.5** (−73%) | 20.6 (−41%) | 13.7 (−61%) |
| Avg code blocks | 2.9 | 1.4 | 2.5 | **1.4** |
| Avg latency (ms) | 7724 | **2246** | 6036 | 5548 |
| Tasks with code | 10/10 | 10/10 | 9/10 | 8/10 |

## Observations

### 1. Ponytail is the most aggressive reducer
Ponytail cuts output tokens by 77% and code LOC by 73%. It achieves this by producing minimal, dense code — often a single code block with no explanation. The response is the code itself, nothing more. This is the "lazy senior dev" behavior: write one line, it works, move on.

### 2. Tom n Jerry always-on favors planning over code
The always-on arm (condensed rules injected as system prompt) produces only 8/10 tasks with code blocks. The system prompt tells the agent to "break down intent into concrete tasks, verify existing solutions, then implement" — and it follows that instruction. The code it does produce is **61% less LOC** than baseline, indicating fewer unnecessary abstractions.

One task (CSV reading) got a step-by-step plan but no code — the agent concluded the task needed `pandas` but stopped at planning. This suggests the always-on rules need a stronger "prove it works by implementing" closing statement.

### 3. Tom n Jerry skills has highest prompt overhead
The skills arm injects the entire always-on-rules.md (~1200 tokens). This adds latency and token cost. In real usage, the system prompt is cached, so this overhead only applies on the first turn. Both TNJ arms should be compared on completion-to-completion cost, not first-turn cost.

### 4. Baseline produces the most verbose code
Baseline (no skill) averages 35 LOC and 587 output tokens. The model writes explanation, then code, then more explanation. It also produces the most code blocks per task (2.9), often including separate "Usage" or "Example" blocks alongside the implementation.

### 5. Code complexity not measured
The LOC metric does not capture code quality, correctness, or dependency choices. A visual inspection shows:
- **Baseline** prefers well-known libraries (pandas, slowapi, yargs)
- **Ponytail** uses standard library whenever possible
- **TNJ arms** follow the opportunity-detection pattern: check environment, prefer existing solutions, then implement

## Methodology Notes

- Single-shot generation (not agentic). Real benefit appears in multi-turn agentic workflows where the skill's opportunity-detection loop fires on each step.
- Same model across all arms (gpt-4o-mini). Results may differ substantially with Claude Sonnet/Opus or o-series models.
- Correctness measured by presence of code blocks and code keywords only — not compilation or test execution.

## Raw Data

See `raw-results.json` for full per-task outputs.
