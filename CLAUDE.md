# CLAUDE.md

This file provide guidance to Claude when working in this repository

## Project Overview

This is a receipt generation system that exports pdf/image to send the output to the customers.


## Tech Stack

- Framework: Reactjs (Routing: TanStack Router)
- Language: Typescript
- Styling: Tailwind CSS v4^  https://tailwindcss.com/
- Package Manager: npm
- Linting: EsLint
- Architecture: Feature Sliced Design v1

### Rules

- colors in index.css


## 🏗 Architecture
- **Feature Sliced Design v1**
- Documentation: https://feature-sliced.design/

# Development Commands

```bash
npm run dev          # Start development server
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

- Commit only in the `develop` branch.
- Never add a Claude co-author trailer or any AI attribution to commits.
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
