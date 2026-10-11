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
- Prefer Type aliases over Interfaces
- Prefer functional components with hooks
- Keep Components small, reusable, focused and single-purpose.
- Always follow DRY and SOLID principles. Keep responsibilities explicit, depend on stable abstractions, and extract shared behavior instead of duplicating logic or UI.
- Follow existing patterns and naming conventions snake_case
- Use fluid sizing and responsive layout primitives such as `w-full`, percentages, flexbox, grid, responsive breakpoint variants, `h-auto`, and `aspect-*`. Maximum constraints such as `max-w-*` and `max-h-*` are allowed.
- Fixed dimensions are allowed only for icons. Avoid arbitrary or exact Tailwind dimensions such as `w-[...]`, `h-[...]`, or `size-[...]` for non-icon elements.

## What to Avoid
- Do not use 'any' types for typescript, create type alias for or inline for simple use case eg. number, string, etc.

## Git Conventions

- Never commit without the author's review. Make the changes, show what changed, and wait for explicit approval before running `git commit`.
- Never add a Claude co-author trailer or any AI attribution to commits.

### Branches

- Feature work goes on a branch named `feature/<branch-name-here>` cut from `develop`.
- Use lowercase and hyphens in the branch name. No spaces, no underscores.
  - Good: `feature/receipt-builder`, `feature/pdf-export`
  - Bad: `feature/Receipt_Builder`, `receipt-builder`, `feat/receipt-builder`
- `develop` is the integration branch. `main` holds released work.
- Never commit directly to `main`.

### Pull requests

- **The pull request title is the branch name, verbatim.** A branch named
  `feature/receipt-builder` opens a PR titled `feature/receipt-builder`.
- Feature branches target `develop`. Only `develop` targets `main`.

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

## Notes
- Claude continually update this file with important information.
