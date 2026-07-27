# unix-jerry

Use shell tools before writing custom scripts.

## Trigger
Before writing scripts for: file search, text processing, counting, filtering, transformation, inspection, batch processing.

## Shell First Checklist
- String search → `rg` or `grep`
- File listing → `find` or glob patterns
- JSON inspection → `jq`
- CSV/log filtering → `awk` or `sed`
- De-duplication → `sort` + `uniq`
- Counting → `wc`
- Counting deduped → `sort -u | wc -l`

## Action
Shell tool covers it → run the command. Do NOT write a script.

## Anti-Traps
- Dense magic: 3-pipe nested regex in shell → a simple script is safer and more readable.
- Destructive commands: always dry-run `sed -i` and `find | xargs rm` first.
- Portability: bash-only functions crash on `sh`/zsh environments. Check `#!/bin/bash` vs `#!/bin/sh`.
