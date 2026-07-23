#!/usr/bin/env bash
# Agentic benchmark CI check — runs both arms, compares, exits with error on regression.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BENCH_DIR="$SCRIPT_DIR"

echo "=== Agentic Benchmark CI Check ==="

# Run baseline
echo ""
echo "--- Arm 1: baseline ---"
OPENAI_API_KEY="${OPENAI_API_KEY}" node "$BENCH_DIR/lib/runner.js" --arm baseline
cp "$BENCH_DIR/results-agentic.json" "$BENCH_DIR/results-agentic-baseline.json"

# Run TNJ
echo ""
echo "--- Arm 2: tom-n-jerry (always-on) ---"
OPENAI_API_KEY="${OPENAI_API_KEY}" node "$BENCH_DIR/lib/runner.js" --arm tnj-alwayson
cp "$BENCH_DIR/results-agentic.json" "$BENCH_DIR/results-agentic-tnj.json"

# Compare
echo ""
echo "=== Comparison ==="
node "$BENCH_DIR/lib/compare.js"

# Check for regressions
echo ""
echo "--- Regression Check ---"

# Rule 1: No unnecessary installs
TNJ_INSTALLS=$(node -e "const d=require('$BENCH_DIR/results-agentic-tnj.json'); console.log(d.results.filter(r => r.triedNewInstall).length)")
if [ "$TNJ_INSTALLS" -gt 0 ]; then
  echo "FAIL: TNJ attempted $TNJ_INSTALLS unnecessary install(s)"
  exit 1
else
  echo "PASS: Zero unnecessary installs"
fi

# Rule 2: No naked plans
TNJ_CODE=$(node -e "const d=require('$BENCH_DIR/results-agentic-tnj.json'); console.log(d.results.filter(r => r.hasCode).length)")
TOTAL_TASKS=$(node -e "const d=require('$BENCH_DIR/results-agentic-tnj.json'); console.log(d.results.length)")
if [ "$TNJ_CODE" -ne "$TOTAL_TASKS" ]; then
  echo "FAIL: TNJ produced code for $TNJ_CODE/$TOTAL_TASKS tasks (expected all)"
  exit 1
else
  echo "PASS: Code produced for all $TOTAL_TASKS tasks"
fi

# Rule 3: No regression in unnecessary installs vs baseline
BASELINE_INSTALLS=$(node -e "const d=require('$BENCH_DIR/results-agentic-baseline.json'); console.log(d.results.filter(r => r.triedNewInstall).length)")
if [ "$TNJ_INSTALLS" -gt "$BASELINE_INSTALLS" ]; then
  echo "FAIL: TNJ ($TNJ_INSTALLS) has more unnecessary installs than baseline ($BASELINE_INSTALLS)"
  exit 1
else
  echo "PASS: TNJ installs ($TNJ_INSTALLS) <= baseline installs ($BASELINE_INSTALLS)"
fi

echo ""
echo "=== All CI checks passed ==="
