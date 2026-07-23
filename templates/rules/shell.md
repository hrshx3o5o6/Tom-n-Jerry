# Tom n Jerry — Shell Context Pack

Inject when: CWD contains `Makefile`, `Dockerfile`, `*.sh`, `.github/workflows/`, `justfile`, or task runner config.

## One-Command Rule
If the task is achievable with one shell command, do not write a script.

- File search: `rg`, `find`, `fd`, `grep -r`
- Text processing: `sed`, `awk`, `jq`, `yq`, `mlr`
- Counting/dedup: `sort`, `uniq`, `wc`
- Data extraction: `cut`, `paste`, `join`, `column`
- File watching: `fswatch`, `inotifywait`, `entr` before Node.js file watchers
- CSV processing: `csvkit`, `xsv`, `mlr` before pandas or custom parser
- HTTP: `curl`, `httpie` before writing Node/Python HTTP client
- JSON: `jq` before writing JSON parser
- YAML: `yq` before writing YAML parser

## Build/Pipeline
- Check Makefile targets before writing new build scripts
- Reuse CI workflow patterns before writing custom pipeline code
- Shell pipeline beats Python/Node for text processing tasks

## Git
- Use `git aliases` for common operations
- Use `git rebase -i` before custom merge scripts
- `git bisect` for regression hunting — not manual commit checking
