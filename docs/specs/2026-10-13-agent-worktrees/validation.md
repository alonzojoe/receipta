# Agent Worktree Isolation — Validation

Documentation, so the gates check that the rule is correct and followable, not that a
feature works.

## Gate 0 — Regression

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0, unchanged count | pass - 90, unchanged |

## Gate 1 — The mechanism works

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Two branches at once | `git worktree add` then `git worktree list` | both listed, different branches | pass - this spec was written in a worktree on `feature/agent-worktrees` while the main tree stayed on `feature/payment-marquee` with an agent working in it |
| Main tree unmoved | check its branch after creating a worktree | pass - still on `feature/payment-marquee` |
| Commits land in the right place | commit in the worktree, check both branches | pass - two commits here, none on the main tree's branch |
| Removal is clean | `git worktree remove` then `list` | pass - see Gate 4 |
| Prune recovers | delete a worktree directory, then `prune` | not run - documented from the git manual rather than exercised |

## Gate 2 — The rule is written where it will be read

| Check | Expected | Result |
| --- | --- | --- |
| `CLAUDE.md` section exists | under Subagents | pass |
| Common case stated first | work-in-place before the exception | pass |
| Commands included | add, remove, list, prune, `git -C` | pass |
| Dispatcher obligation stated | no branch switching while an agent runs | pass |
| Cleanup stated | including abandoned worktrees | pass |
| Location stated | outside the repository | pass |

## Gate 3 — Agent definitions

| Agent | Needs the rule | Carries it | Result |
| --- | --- | --- | --- |
| `code-reviewer` | yes - it caused this | yes | pass |
| `frontend-designer` | yes - writes files | yes | pass |
| `debugger` | yes - writes files | yes | pass |
| `qa-tester` | yes - writes files | yes | pass |
| `performance-monitor` | yes - writes files | yes | pass |
| `planner` | no - read-only, no branch switching | n/a | pass - deliberately left alone |
| `product-manager` | no - read-only, no branch switching | n/a | pass - deliberately left alone |

## Gate 4 — No strays left behind

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No leftover worktrees | `git worktree list` | only the main tree | pass - removed after pushing |
| Nothing untracked added | `git status --short` | clean | pass |

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
