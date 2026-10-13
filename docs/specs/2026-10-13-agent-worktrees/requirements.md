# Agent Worktree Isolation — Requirements

## Goal

Stop background agents and the session that dispatched them from fighting over one
working directory.

## The bug, as it actually happened

On 13 October, while `code-reviewer` was reviewing PR #13 in the background:

1. The reviewer ran `git checkout feature/payment-marquee` to read the diff.
2. That switched the branch in the **shared working directory**.
3. The dispatching session, meanwhile, was editing `CLAUDE.md` on
   `feature/auto-code-review` and committed.
4. The commit landed on `feature/payment-marquee`.

Nothing was pushed wrong and it was cherry-picked back. The next one may not be caught.

The agent reported it accurately and without being asked:

> *"The only working-tree state is a pre-existing uncommitted change to `CLAUDE.md` on
> `feature/auto-code-review`, which came with me when I switched to
> `feature/payment-marquee`."*

That sentence is the whole bug. Uncommitted work followed the agent across a branch
switch it did not know was dangerous.

## Why it is worse than one misplaced commit

- **Silent.** Git does not warn. The commit succeeds, on the wrong branch, with the
  right message.
- **Arbitrarily bad.** Two agents on different branches would interleave edits in one
  tree. The result compiles and is wrong.
- **Worst when it matters.** The whole point of dispatching agents is parallel work,
  which is exactly when branches differ.
- **Review becomes unreliable.** A reviewer reading a tree that another agent is editing
  reviews something that never existed.

## What a fix must do

1. An agent that needs a branch other than the current one gets its **own checkout**.
2. The dispatching session's working tree is **never changed by an agent**.
3. Two agents on different branches cannot see each other's files.
4. Agents that only need the current branch keep working as they do now. Most reviews
   and most edits are on the branch already checked out, and the common case should not
   get slower.

## Approach: git worktrees

`git worktree add <path> <branch>` gives a second checkout of the same repository, with
its own HEAD and its own working files, sharing one object store and one set of refs.

That is exactly the shape of the problem: same repository, same history, separate files.

Already proven in practice - this very spec was written in a worktree on
`feature/agent-worktrees` while the main tree stayed on `feature/payment-marquee` with
an agent working in it. Both branches were checked out at once and neither moved the
other.

### Why not the alternatives

| Alternative | Why not |
| --- | --- |
| Forbid agents from switching branches | Agents genuinely need to read other branches to review a PR. A rule that forbids the necessary thing gets broken. |
| Clone the repository per agent | Copies the whole object store and loses the shared refs. Worktrees give the same isolation for a fraction of the cost. |
| Serialise agents, never run two at once | Throws away the main reason to dispatch agents. |
| Stash before dispatching | Hides the symptom. Two agents on different branches still collide. |

## Rules to write down

**When an agent needs a different branch**, it creates a worktree, works there, and
removes it when finished. It does not `git checkout` in the shared tree.

**When an agent only needs the current branch**, it works in place. This is the common
case and stays unchanged.

**The dispatching session does not switch branches while an agent is running.** Even
with worktrees in place, moving the shared tree under a running agent is an obvious way
to confuse it.

**A worktree is removed when its task finishes.** An abandoned worktree is a stale
checkout that someone later edits by mistake.

**Worktrees live outside the repository**, so they never appear as untracked files in
the main tree.

## Out of scope

- Changing how agents are dispatched or what they are for.
- Any change to the review workflow itself. This is about where files live.
- Automating worktree creation inside the agent framework. The rules go in `CLAUDE.md`
  and each agent definition; the framework is not ours to change.

## Acceptance criteria

1. `CLAUDE.md` documents the rule, with the commands
2. Every agent definition that can write or switch branches carries it
3. The rule distinguishes the common case (same branch, work in place) from the one that
   needs isolation
4. Cleanup is specified, including what to do with an abandoned worktree
5. The worktree location keeps it out of the repository's own status
6. `npm run build`, `npm run lint`, `npm test` all exit 0 - documentation only, so this
   is a regression check rather than a feature check
