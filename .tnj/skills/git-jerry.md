# git-jerry

Search git history before rebuilding deleted features.

## Trigger
Before recreating a deleted file or feature. Before restoring reverted code. When diagnosing when a bug was introduced.

## Checks
1. `git log --grep="feature-name"` — find commits where the feature existed.
2. `git log -S "deleted_function_name"` — find commits that removed code.
3. `git show <commit_hash>:<path>` — view deleted content without checkout.
4. `git blame <file>` — see why lines were changed.
5. `git branch -a` — check other branches for working implementations.

## Action
- Found it → restore it. Emit Opportunity Card (type: history).
- Not found → implement directly.

## Anti-Traps
- Zombie code: restoring without reading the deletion commit message — it was deleted for a reason.
- Destructive checkout: `git checkout` that overwrites uncommitted user changes.
- Merge conflicts: restoring huge legacy files that conflict with modern design.
