# Agent Worktree Isolation — Implementation Plan

Branch `feature/agent-worktrees`, cut from `main`. PR targets `main`, titled with the
branch name.

Documentation and agent configuration only. No application code changes.

| Commit | Covers |
| --- | --- |
| `docs: add agent worktree isolation spec` | the spec |
| `docs: give agents their own worktree when they need another branch` | tasks 1-2 |

## Task 1 — The rule in CLAUDE.md

A section under Subagents, because it is a property of running agents rather than of git.

It must say, in this order:

1. **The common case first.** An agent working on the branch already checked out works
   in place. Most do. Leading with the exception would make every agent reach for a
   worktree it does not need.
2. **The exception.** An agent that needs a different branch creates a worktree.
3. **The dispatcher's obligation.** Do not switch branches in the shared tree while an
   agent is running.
4. **Cleanup**, including abandoned worktrees.

With the commands, since a rule nobody can follow from memory gets ignored:

```bash
git worktree add <path-outside-the-repo> <branch>   # existing branch
git worktree add <path> -b <new-branch> main        # new branch
git -C <path> <command>                              # work in it without cd
git worktree remove <path>                           # when finished
git worktree list                                    # find strays
git worktree prune                                   # drop records of deleted dirs
```

**Why `git -C`:** it runs a command in another directory without changing the shell's
own, which is the habit that keeps the two trees from being confused.

## Task 2 — The agent definitions

Only the ones that can write or switch branches: `frontend-designer`, `debugger`,
`qa-tester`, `performance-monitor`, and `code-reviewer`.

`code-reviewer` matters most and is the least obvious: it is read-only on the repository
and still caused this, because reading a PR's diff meant checking out its branch. Being
read-only on files is not the same as being harmless to the tree.

`planner` and `product-manager` **also get the rule**, despite being described as
read-only. Their tool lists include `Bash`, so they can run `git checkout` whether or not
their job calls for it. Read-only is a convention here, not a capability, and the
difference matters: the original incident was caused by an agent that was read-only on
files.

## Task 3 — Verify

Documentation, so verification is that the rule is correct and followable rather than
that code works.

- Prove two branches can be checked out at once and neither moves the other. Already
  done while writing this spec, and worth recording with the actual output.
- Confirm the commands as written run clean.
- Confirm `git worktree list` shows strays and `prune` clears them.
- Run the full suite as a regression check: nothing here should touch it.

## Risks

**Rules that live only in prose get skipped under time pressure.** Nothing enforces
this; it holds because the agent definitions repeat it where an agent will actually read
it. If it is skipped again, the honest fix is a dispatcher-side check, not a sterner
paragraph.

**Stale worktrees accumulate.** Every one is a checkout someone can edit by accident,
with changes that go nowhere. `git worktree list` is the periodic check.

**Worktrees in a temporary directory can be deleted by the system** while git still has
a record of them. `git worktree prune` is the repair, and the rule says so rather than
leaving a confusing error for someone to diagnose later.
