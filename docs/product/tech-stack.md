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

## Export: html2canvas-pro + jsPDF

Decided 2026-10-11. Not installed yet — it lands with Phase 2, since nothing consumes it
before then.

The receipt preview is rasterised by `html2canvas-pro`, which gives the PNG directly.
`jsPDF` then wraps that raster into a PDF sized to the receipt. One pipeline, two outputs.

**Why rasterise instead of a real PDF renderer.** Both PNG and PDF ship in v1, and PNG
needs a rasteriser regardless. Choosing `@react-pdf/renderer` would not replace that
pipeline, it would add a second one, and the receipt layout would be written twice in two
different styling systems. For a single-page receipt that guarantees drift between the
preview and the export. One source of truth beats selectable text here.

**Why `html2canvas-pro` and not the alternatives.**

| Candidate | Why not |
| --- | --- |
| `html2canvas` | Abandoned at 1.4.1. Fails on modern CSS colour functions. |
| `html-to-image` | Last published April 2025. |
| `modern-screenshot` | Actively maintained and a genuine option. Kept as the fallback: it renders via SVG `foreignObject`, a different failure profile, so it is what we reach for if fidelity problems appear. |
| `jsPDF.html()` | Wraps html2canvas internally, inheriting its colour bugs with less control. |

`html2canvas-pro` is the maintained fork that explicitly added `oklch()`, `lab()`, and
`lch()` support — exactly the Tailwind v4 risk. Zero dependencies, published within the
last week.

**The accepted tradeoff.** The PDF is a high-resolution image, so its text is not
selectable or searchable. For a proof-of-payment document viewed on a phone, that costs
nothing real.

**Two mitigations, both required.**

1. **Render at 3× scale.** A ~600 px receipt at 3× is 1800 px, above the ~1748 px needed
   for 300 dpi at A5 width. No visible blur in print.
2. **The receipt preview uses fixed hex colours and never dark mode.** A receipt is a
   document, not UI: black on white regardless of the app's theme. This is the correct
   design call on its own, and it also removes the `oklch()` export risk entirely, since
   no theme token reaches the rasterised node.

Phase 2 must still verify in real output: the ₱ sign renders, Geist embeds or falls back
cleanly, item images appear, and the receipt fits its page bounds.

## Still open

**No test runner.** Nothing is installed. The money math — subtotals, discount, total,
rounding — is exactly the kind of logic that deserves tests, so this should be settled
before Phase 1 implementation rather than after.
