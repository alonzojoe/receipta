# Tech Stack

The terse list lives in `CLAUDE.md`. This file holds the reasoning, so the two do not
drift: `CLAUDE.md` tells an agent what to use, this tells a human why.

## Settled

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | React 19 | Already the team's default. Nothing here needs a framework with a server story, since Receipta has no backend. |
| Build tool | Vite 8 | Fast dev server, and a static `dist/` is exactly our deployment target. |
| Language | TypeScript 6 | Type aliases over interfaces, no `any`. See `CLAUDE.md`. |
| Styling | Tailwind CSS v4 | Via `@tailwindcss/vite`, no PostCSS config. Theme tokens live in `src/index.css`. |
| UI components | shadcn/ui | Components are copied into the repo, not imported from a package, so we own and can restyle them. Radix base, Nova preset, neutral palette. |
| Routing | TanStack Router | Type-safe routes. Overkill for the route count, but it is the team standard and costs nothing. |
| Forms | TanStack Form | The receipt builder is one large nested form with a dynamic array of item rows. Hand-rolled state would not survive that. |
| Icons | react-icons | One icon library for everything we write. |
| Toasts | react-hot-toast | Small, and enough for export success and failure feedback. |
| Class merging | `clsx` + `tailwind-merge` | Wrapped in `cn()` in `src/lib/utils.ts`. Conflicting utilities resolve last-wins, which is what makes component overrides work. |
| Variants | `class-variance-authority` | What shadcn components are built on. |
| Currency | `Intl.NumberFormat('en-PH')` | Native, zero dependency, and correct: `₱1,234.56`. Never hand-roll money formatting. |
| Architecture | Feature Sliced Design v1 | Layer import rules keep the receipt entity, the builder feature, and the export feature from tangling. |

## Decisions with a caveat

**`lucide-react` is present but restricted.** shadcn's generated components import it
directly, so it cannot be removed without forking every component. It is allowed inside
`src/components/ui/` only; everything we write uses react-icons.

**The `shadcn` CLI is a devDependency.** Its init put itself in `dependencies`, which is
wrong for a build-time tool. `npm audit` reports high-severity advisories in its
`braces`/`micromatch`/`fast-glob` chain — a glob-pattern DoS reachable only by running the
CLI, never in the shipped bundle. The only fix is a major CLI downgrade, so it stands.

**Geist comes from the Nova preset** and adds roughly 69 kB of font files. Keep it or
pick a different typeface during Phase 4 polish, but it is a deliberate cost right now,
not an accident.

**Payment brand logos are local SVGs.** react-icons carries no GCash, Maya, MariBank, or
Philippine bank icons — verified, not assumed. Those four logos live as inline SVG
components under the shared layer. This does not violate the one-icon-library rule; they
are assets, not a second library.

**snake_case applies to generated shadcn files too.** That was a deliberate call in favour
of repo consistency over tooling convenience. The cost: after
`npx shadcn@latest add <component>`, multi-word files need renaming by hand
(`dropdown-menu.tsx` → `dropdown_menu.tsx`) and their imports fixed.

## Still open

**Export library — the one real gap.** Nothing is installed for PDF or image export yet,
and it is the highest-risk choice left because it determines export fidelity. The
candidates:

- `html-to-image` or `html2canvas` to rasterise the preview, then `jsPDF` to wrap the
  raster in a PDF. Simple, and the PDF is a picture of a receipt: no selectable text, and
  it blurs when zoomed or printed large.
- A real PDF renderer such as `@react-pdf/renderer`, which draws the PDF from its own
  component tree. Sharp, selectable text at any zoom, but the receipt layout has to be
  written twice: once in HTML for the preview, once for the PDF.
- `jsPDF` with its HTML plugin. One codebase, but weak CSS support, and Tailwind v4's
  `oklch()` colours are a known problem for it.

This needs its own spec section in Phase 2, with the peso sign, embedded item images, and
page bounds verified in real output before the choice is locked.

**No test runner.** Nothing is installed. The money math — subtotals, discount, total,
rounding — is exactly the kind of logic that deserves tests, so this should be settled
before Phase 1 implementation rather than after.
