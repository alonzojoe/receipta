# Roadmap

Phases are ordered by dependency, not by calendar. Each phase is a candidate for its
own spec folder under `docs/specs/`.

## Phase 0 — Foundation ✅ shipped

Scaffolding only. None of it decides what the app does.

- Vite + React 19 + TypeScript project
- Tailwind CSS v4 wired through the Vite plugin
- shadcn/ui initialised, `@/*` path alias, `cn()` Tailwind merge helper
- TanStack Router and TanStack Form installed
- react-icons, react-hot-toast
- Vite template styles, markup, and assets removed
- Vitest + React Testing Library, with the `cn()` helper covered
- `CLAUDE.md` conventions, `docs/product/`, `docs/specs/`

## Phase 1 — Receipt builder

The core loop: build a receipt and see it.

- FSD layer structure under `src/`
- Router wired with the builder route
- Issuer section — individual or organization, name only
- Client section — name
- Item rows — add, edit, remove. Name, quantity, unit price, computed subtotal.
- Optional image per item, with client-side downscaling
- Totals — subtotal, optional discount, total
- Payment mode dropdown with local brand SVG logos
- PHP formatting via `Intl.NumberFormat('en-PH')` throughout
- Live receipt preview

**Done when** a user can fill the whole form and see an accurate receipt on screen.

## Phase 2 — Export

Turning the preview into something sendable.

- Export as PDF
- Export as PNG
- Export library chosen and justified — still open, see `tech-stack.md`
- Toast feedback on export success and failure
- Verify output fidelity: fonts, peso sign, images, page bounds

**Done when** both exports produce a correct receipt matching the on-screen preview.

## Phase 3 — Issuer profile persistence

Removing the friction of the second receipt.

- Save issuer name in the browser
- Pre-fill it on return
- Let the user edit or clear it

**Done when** a returning user does not retype their name.

## Phase 4 — Polish

Earned only after the loop works end to end.

- Receipt layout and typography
- Colour palette replacing shadcn's neutral defaults
- Motion, using the installed animation skills
- Empty, loading, and error states
- Edge-case hardening — long names, many items, zero amounts, huge quantities
- Favicon replacing the leftover Vite logo

## Not scheduled

Wanted, but not committed to, and each needs its own justification first.

- Receipt history — a list of past receipts in the browser
- Multiple receipt templates
- Issuer logo upload
- Reusable client list
- Multi-currency
