# Receipta

A receipt generation system. Build a receipt, preview it, and export it as a **PDF** or **image** to send to your customers.

> **Status:** early setup. The project is scaffolded with Vite + React + TypeScript; receipt features are being specced before implementation.

## Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | React |
| Routing | TanStack Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | react-icons |
| Toasts | react-hot-toast |
| Build tool | Vite |
| Package manager | npm |
| Linting | ESLint |
| Architecture | [Feature Sliced Design v1](https://feature-sliced.design/) |

## Getting Started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

The dev server prints a local URL to open in your browser.

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run preview      # Preview the production build locally
npm run lint         # Lint the project with ESLint
```

## Architecture

The codebase follows **Feature Sliced Design v1**. Code is organized into layers, each layer into slices, and each slice into segments:

```
src/
  app/        # App-wide setup: providers, routing, global styles
  pages/      # Route-level compositions
  widgets/    # Self-contained blocks composed of features and entities
  features/   # User-facing capabilities (e.g. build a receipt, export a receipt)
  entities/   # Business entities (e.g. receipt, line item, customer)
  shared/     # Reusable primitives: ui, lib, config, types
```

A layer may only import from the layers below it. See the [FSD documentation](https://feature-sliced.design/) for the full rules.

Design tokens and colors live in `src/index.css`.

## Conventions

Contributor guidance — code conventions, styling rules, and commit format — lives in [`CLAUDE.md`](./CLAUDE.md).

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `perf:`, …) and land on the `develop` branch.
