# Tom n Jerry Benchmarks

## Methodology

Adapted from Ponytail's benchmark approach: headless single-shot generation, same model across all arms, 10 everyday coding tasks.

### Arms

| Arm | Description |
|---|---|
| **baseline** | Raw model with no skill instructions |
| **ponytail** | Ponytail rules injected as system prompt (requires `@dietrichgebert/ponytail`) |
| **tnj-skills** | Tom n Jerry always-on rules injected as system prompt |
| **tnj-alwayson** | Tom n Jerry always-on rules + loop structure |

### Metrics

- **code_loc**: Lines of code produced (excluding markdown prose)
- **correct**: Binary — output contains plausible code (1) or not (0)

### Run

```bash
export ANTHROPIC_API_KEY=sk-...
npx promptfoo eval -c benchmarks/promptfooconfig.yaml
npx promptfoo view
```

### Agentic Benchmark (Future)

The single-shot generation above is a proxy. The real benchmark requires a headless agent (Claude Code API) editing a real repository. See Ponytail's methodology for the gold standard.
