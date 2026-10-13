# CLAUDE.md

This file provide guidance to Claude when working in this repository

## Project Overview

This is a receipt generation system that exports pdf/image to send the output to the customers.


## Tech Stack

- Framework: Reactjs (Routing: TanStack Router)
- Language: Typescript
- Styling: Tailwind CSS v4^  https://tailwindcss.com/
- UI Components: shadcn/ui  https://ui.shadcn.com/
- Forms: TanStack Form  https://tanstack.com/form/
- Icons: react-icons  https://react-icons.github.io/react-icons/
- Toasts / Notifications: react-hot-toast  https://react-hot-toast.com/
- Package Manager: npm
- Linting: EsLint
- Testing: Vitest + React Testing Library
- Architecture: Feature Sliced Design v1

### Rules

- colors in index.css
- Use `react-icons` for all icons. Do not add another icon library.
- Use `react-hot-toast` for all toast notifications. Do not add another toast library.
- Use `shadcn/ui` for UI primitives. Compose and extend its components instead of hand-rolling equivalents.
- Use `TanStack Form` for all form state and validation. Do not use uncontrolled ad-hoc form handling.
- `lucide-react` is allowed only inside generated `shadcn/ui` primitives. All code we write uses `react-icons`.
- snake_case applies to every file, including generated `shadcn/ui` components. After `npx shadcn@latest add <component>`, rename multi-word files to snake_case (`dropdown-menu.tsx` -> `dropdown_menu.tsx`) and fix the imports.
- Test files sit next to the code they cover as `<name>.test.ts` / `<name>.test.tsx`.
- Money math (subtotals, discount, totals, rounding) must have unit tests. It is the logic most likely to be wrong and the cheapest to cover.
- Format all money with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })` -> `₱1,234.56`. Always two decimal places. Never hand-roll currency formatting.


## 🏗 Architecture
- **Feature Sliced Design v1**
- Documentation: https://feature-sliced.design/

# Development Commands

```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run lint         # Lint with ESLint
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

## Code Conventions

- Use typescript for all new files .ts tsx
- Prefer Type aliases over Interfaces. The one exception is TypeScript module
  augmentation, which cannot augment a type alias - see the `Register` interface in
  `src/app/router.tsx`.
- Prefer functional components with hooks
- Keep Components small, reusable, focused and single-purpose.
- Always follow DRY and SOLID principles. Keep responsibilities explicit, depend on stable abstractions, and extract shared behavior instead of duplicating logic or UI.
- Follow existing patterns and naming conventions snake_case
- File names are snake_case: `home_page.tsx`, `root_route.tsx`, `payment_mode_select.tsx`.
- **Component identifiers are PascalCase**, because JSX treats a lowercase tag as an HTML
  element: `<home_page />` renders a literal `<home_page>` DOM node. So the file is
  `home_page.tsx` and the export inside it is `HomePage`. This is a language constraint,
  not a style preference.
- Everything that is not a component stays snake_case: constants, functions, types, route
  objects (`root_route`, `home_route`), config keys.
- **Custom hooks are camelCase**, for the same kind of reason: React's
  `react-hooks/rules-of-hooks` only recognises a hook when its name is `use` followed by
  an uppercase letter, so `use_scrolled_past` is not linted as a hook. The file stays
  snake_case (`use_scrolled_past.ts`), the export is `useScrolledPast`.
- A file must not export both components and non-components. ESLint's
  `react-refresh/only-export-components` enforces this: keep route objects and layout
  components in separate files.
- Use fluid sizing and responsive layout primitives such as `w-full`, percentages, flexbox, grid, responsive breakpoint variants, `h-auto`, and `aspect-*`. Maximum constraints such as `max-w-*` and `max-h-*` are allowed.
- Fixed dimensions are allowed only for icons. Avoid arbitrary or exact Tailwind dimensions such as `w-[...]`, `h-[...]`, or `size-[...]` for non-icon elements.

## What to Avoid
- Do not use 'any' types for typescript, create type alias for or inline for simple use case eg. number, string, etc.

## Git Conventions

- Never commit without the author's review. Make the changes, show what changed, and wait for explicit approval before running `git commit`.
- Never add a Claude co-author trailer or any AI attribution to commits.

### Branches

- Feature work goes on a branch named `feature/<branch-name-here>` cut from `main`.
- Use lowercase and hyphens in the branch name. No spaces, no underscores.
  - Good: `feature/receipt-builder`, `feature/pdf-export`
  - Bad: `feature/Receipt_Builder`, `receipt-builder`, `feat/receipt-builder`
- **The branch name and the PR title are chosen together, before work starts**, because
  the PR title is the branch name verbatim. Pick the name the PR should carry.
- Never commit directly to `main`. Every change reaches it through a pull request.

### Pull requests

**Feature PRs target `main` directly.** Do not route them through `develop`.

- **The title is the branch name, verbatim.** A branch named `feature/receipt-builder`
  opens a PR titled `feature/receipt-builder`.
- Base branch is `main`.

**Release PR (`develop` into `main`)** - only when `develop` has accumulated work that
has not reached `main` yet. This should become rare now that features go straight to
`main`.

- The title is a short generic description of what is being released, not the branch
  name. `develop` as a title tells a reader nothing.
  - Good: `chore: project setup and product specs`, `feat: receipt builder and export`
  - Bad: `develop`

### After opening a pull request

Every PR goes through review before it merges. The flow is fixed:

1. **Open the PR.**
2. **Run `code-reviewer` immediately, without being asked.** Opening a PR is the
   trigger. Do not stop to ask whether a review is wanted - it always is.

   It reviews the diff and posts its findings as **inline comments on the changed
   lines**, through the GitHub account, with
   `gh api repos/<owner>/<repo>/pulls/<n>/comments`. Comments sit on the code they refer
   to rather than in one lump at the bottom, so a reader meets them in context.
3. **Report the review to the author.** Say how many findings there are, how severe, and
   what the PR number is. Do not merge silently.
4. **The findings are addressed** by whichever agent owns that area - `frontend-designer`
   for UI, `debugger` for a defect, `qa-tester` for missing coverage. Fixes are pushed to
   the same branch, so the PR updates in place.
5. **Reply to each comment and resolve its conversation.** The reply says what changed,
   or why the finding was not acted on. Then resolve the thread, so an unresolved
   conversation always means something is still outstanding.
6. **Re-review after the fixes**, against the new diff. A fix can miss the point or
   introduce something new, and nothing else checks that.
7. **The author merges.** Not an agent, ever. Every conversation resolved is a
   precondition for merging, not permission to merge: a merge is a commit on `main`, so
   the same gate applies as every other commit. Report that the PR is ready and stop
   there.

Resolving a thread needs GraphQL; the REST API cannot do it:

```bash
# thread ids
gh api graphql -f query='{ repository(owner:"<owner>", name:"<repo>") {
  pullRequest(number:<n>) { reviewThreads(first:50) {
    nodes { id isResolved comments(first:1){ nodes{ path line } } } } } } }'

# resolve one
gh api graphql -f query='mutation { resolveReviewThread(input:{threadId:"<id>"})
  { thread { isResolved } } }'
```

Rules for review comments:

- **No AI attribution anywhere.** Not in the comment body, not as a trailer, not as a
  signature. The same rule as commits.
- A finding states what is wrong, why it matters, and the fix. "Consider refactoring" is
  not a finding.
- If the review finds nothing, say so plainly rather than inventing a nit to look
  thorough.
- A finding that is wrong on inspection is disputed in a reply to that comment, stating
  why. It is not silently obeyed, and it is not silently ignored.
- **The author decides a dispute**, and decides what counts as won't-fix. An agent may
  argue a finding is wrong; it does not get to close the question.

### Commit messages

- Use Conventional Commits for every message: `<prefix>: <message>`

| Prefix | Use for |
| --- | --- |
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `chore` | Tooling, config, dependencies, housekeeping |
| `perf` | A performance improvement |
| `refactor` | Restructuring code without changing behavior |
| `style` | Formatting only, no logic change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `build` | Build system or build script changes |
| `ci` | CI pipeline changes |
| `revert` | Reverting a previous commit |

- Write messages in the imperative mood, lowercase after the prefix, no trailing period.
  - Good: `feat: add pdf export to receipt preview`
  - Bad: `Feat: Added PDF Export.`

## Subagents

Project agents live in `.claude/agents/`. Each is scoped to this codebase and knows its
rules, so prefer them over generic help.

| Agent | Use for |
| --- | --- |
| `product-manager` | What a feature must do, acceptance criteria, whether work is actually done |
| `planner` | Turning an approved spec into an ordered, checkable implementation plan |
| `frontend-designer` | Any UI work: components, layout, colour, typography, motion |
| `qa-tester` | Writing tests, running the suite, verifying acceptance, hostile input |
| `code-reviewer` | Reviewing a diff or branch before merge. Read-only. |
| `debugger` | A failing test, a stack trace, a build failure, behaviour that is wrong |
| `performance-monitor` | Slowness, jank, dropped frames, bundle growth, console errors |

A rough order for a feature: `product-manager` to settle what and when it is done,
`planner` to sequence it, `frontend-designer` to build it, `qa-tester` to verify,
`code-reviewer` before merge. `debugger` and `performance-monitor` are reactive.

## Notes
- Claude continually update this file with important information.
