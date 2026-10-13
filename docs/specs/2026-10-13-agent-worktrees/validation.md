# Agent Worktree Isolation — Validation

Documentation, so the gates check that the rule is correct and followable, not that a
feature works.

## Gate 0 — Regression

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0, unchanged count | — |

## Gate 1 — The mechanism works

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Two branches at once | `git worktree add` then `git worktree list` | both listed, different branches | — |
| Main tree unmoved | check its branch after creating a worktree | unchanged | — |
| Commits land in the right place | commit in the worktree, check both branches | only the worktree's branch moves | — |
| Removal is clean | `git worktree remove` then `list` | gone, main tree unaffected | — |
| Prune recovers | delete a worktree directory, then `prune` | the stale record clears | — |

## Gate 2 — The rule is written where it will be read

| Check | Expected | Result |
| --- | --- | --- |
| `CLAUDE.md` section exists | under Subagents | — |
| Common case stated first | work-in-place before the exception | — |
| Commands included | add, remove, list, prune, `git -C` | — |
| Dispatcher obligation stated | no branch switching while an agent runs | — |
| Cleanup stated | including abandoned worktrees | — |
| Location stated | outside the repository | — |

## Gate 3 — Agent definitions

| Agent | Needs the rule | Carries it | Result |
| --- | --- | --- | --- |
| `code-reviewer` | yes - it caused this | | — |
| `frontend-designer` | yes - writes files | | — |
| `debugger` | yes - writes files | | — |
| `qa-tester` | yes - writes files | | — |
| `performance-monitor` | yes - writes files | | — |
| `planner` | no - read-only, no branch switching | n/a | — |
| `product-manager` | no - read-only, no branch switching | n/a | — |

## Gate 4 — No strays left behind

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No leftover worktrees | `git worktree list` | only the main tree | — |
| Nothing untracked added | `git status --short` | clean | — |

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
