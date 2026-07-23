#!/usr/bin/env bash
# Run both arms of the agentic benchmark
set -e

echo "=== Agentic Benchmark: Both Arms ==="

echo ""
echo "=== Arm 1: Baseline (no skill) ==="
node benchmarks/agentic/lib/runner.js --arm baseline
cp benchmarks/agentic/results-agentic.json benchmarks/agentic/results-agentic-baseline.json

sleep 2

echo ""
echo "=== Arm 2: Tom n Jerry (always-on) ==="
node benchmarks/agentic/lib/runner.js --arm tnj-alwayson
cp benchmarks/agentic/results-agentic.json benchmarks/agentic/results-agentic-tnj.json

echo ""
echo "=== Comparison ==="
node benchmarks/agentic/lib/compare.js
