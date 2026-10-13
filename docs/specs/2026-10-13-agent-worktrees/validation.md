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
| Main tree unmoved | check its branch after creating a worktree | unchanged | pass - still on `feature/payment-marquee` |
| Commits land in the right place | commit in the worktree, check both branches | pass - two commits here, none on the main tree's branch |
| Removal is clean | `git worktree remove` then `list` | pass - see Gate 4 |
| Prune recovers | delete a worktree directory, then `prune` | the stale record clears | pass - ran it: the directory shows as `prunable`, and `prune` clears it |

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
| `planner` | **yes** - has `Bash`, so it can run `git checkout` | yes | pass - the original exclusion was wrong |
| `product-manager` | **yes** - has `Bash`, so it can run `git checkout` | yes | pass - the original exclusion was wrong |

## Gate 4 — No strays left behind

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No leftover worktrees | `git worktree list` | only the main tree | pass - removed after pushing |
| Nothing untracked added | `git status --short` | clean | pass |

## What the review caught

Three of these were errors in the rule itself, not nits:

**The documented command did not work.** `git worktree add <path> <branch>` fails with
`fatal: '<branch>' is already used by worktree` when that branch is checked out
anywhere - which is precisely the case an agent hits when reviewing the branch the main
tree is on. Reproduced, then fixed: read with `gh pr diff` where possible, and use
`git worktree add --detach <path> origin/<branch>` where a checkout is genuinely needed.

**`planner` and `product-manager` were excluded as read-only. They are not.** Both have
`Bash` in their tool lists, so both can run `git checkout`. Read-only here is a
convention, not a capability. Both now carry the rule.

**The rule named only `git checkout`.** `switch`, `reset`, `stash` and `pull` move the
branch too. The cheap guard that would actually have caught the original incident -
`git branch --show-current` before committing - was missing entirely and is now in.

Also fixed: unique worktree paths, since two agents sharing `/tmp/<name>` collide in
exactly the way this is meant to prevent; a note that `/tmp` is unsafe for a worktree
holding commits because macOS clears it; and a note that a fresh worktree has no
`node_modules`.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
