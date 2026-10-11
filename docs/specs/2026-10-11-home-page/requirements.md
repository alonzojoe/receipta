# Home Page — Requirements

## Goal

A single marketing landing page at `/` that explains what Receipta does and sends the
visitor to the receipt builder. It is the first thing anyone sees, so it carries the
brand: logo, purple palette, typography, and the component primitives every later page
reuses.

This page ships before the builder exists. Its primary call to action therefore points
at a route that is not yet built.

## Scope

### In scope

- The `/` route, rendered through TanStack Router
- Receipta logo as an SVG component, plus a favicon wired via `<link rel="icon">`
- Purple theme tokens replacing shadcn's neutral defaults in `src/index.css`
- `button` as the first shadcn primitive, with its full variant set exercised on the page
- Footer with Privacy and Terms links, and author attribution with a GitHub link
- Responsive layout from 320 px to wide desktop
- Light and dark mode

### Out of scope

- The receipt builder itself. The primary CTA points to `/create`, which renders a
  placeholder until Phase 1.
- Privacy and Terms pages. Those links are `#` placeholders by explicit decision.
- Blog, pricing, auth, newsletter capture, analytics.
- Payment brand logo SVGs. The payment strip uses text until official brand assets are
  sourced, so no placeholder marks are invented.

## Brand

### Logo

A rounded-square mark holding a receipt glyph with a torn zigzag bottom edge, paired with
the wordmark "Receipta".

- Built as an SVG React component, not an image file, so it inherits `currentColor` and
  theme correctly
- Three exports: `LogoMark` (the square alone), `LogoWordmark` (text alone), `Logo`
  (both, for the nav). File is `logo.tsx`; component identifiers are PascalCase because
  JSX requires it.
- The mark must stay legible at 16 px, which rules out interior detail finer than the
  zigzag
- A standalone `public/favicon.svg` carries the same mark, replacing the Vite logo, and is
  referenced from `index.html` with `<link rel="icon" type="image/svg+xml" />`

### Colour

Purple is the brand. The palette is a single violet hue carried through every token, so
the accent never reads as a sticker applied to a grey app.

- Hue held at roughly 295 in oklch across the ramp
- `--primary` is a saturated violet; the neutrals carry a trace of the same hue rather
  than being pure grey
- All tokens live in `src/index.css` per the project rule. No colour literals in
  components.
- Both `:root` and `.dark` sets are defined. The dark set is not an inversion; it lifts
  primary lightness so it stays legible on a dark surface.
- Contrast: body text and interactive labels must reach WCAG AA (4.5:1). Large display
  text may sit at 3:1.

### Typography

Geist, already installed and bound to `--font-sans`. One family, weight and size carry
the hierarchy. No second typeface.

## Page structure

Eight sections, top to bottom.

1. **Nav** — logo left; "How it works" and "Why Receipta" anchors centre; "Create receipt"
   button right. Anchors collapse on mobile, leaving logo and button.
2. **Hero** — headline, subheadline, two CTAs, and a receipt visual.
   - Headline: **Send receipts, not screenshots.**
   - Subheadline: Receipta turns a GCash, Maya, MariBank, or bank transfer payment into a
     clean receipt you can send in seconds. No signup, no fees, and nothing leaves your
     device.
   - Primary CTA "Create a receipt" → `/create`. Secondary CTA "How it works" → `#how`.
   - Visual: a static mock receipt built from real markup, showing two item rows, a
     discount line, a total, and a reference number. It doubles as a layout rehearsal for
     the real receipt component.
3. **How it works** — three numbered steps: *Fill in the details*, *Review the summary*,
   *Export and send*. One line of copy each.
4. **Why Receipta** — a card grid of six, each an icon, a short title, and one sentence:
   - Looks deliberate — a real document instead of a forwarded screenshot
   - Works with how you get paid — GCash, Maya, MariBank, bank transfer
   - Peso-perfect — amounts always formatted ₱1,234.56
   - Item photos — attach a picture to any line item
   - PDF or image — PDF to print, image to send in chat
   - Private by default — no account, no server, nothing uploaded
5. **Payment modes** — a quiet strip: "Works with how you already get paid," then the four
   provider names. Text only for now; the strip is built to take logo components later.
6. **Privacy** — one short block restating that there is no account and no server, because
   it is the strongest differentiator and deserves its own moment rather than one card.
7. **Closing CTA** — headline "Your next receipt takes about a minute." and the primary
   button repeated.
8. **Footer** — three parts:
   - Logo and a one-line descriptor
   - Links: Privacy Policy `#`, Terms & Conditions `#`
   - Attribution: "Built by Joenell Canlas Alonzo" with a GitHub icon linking to
     `https://github.com/alonzojoe`, opening in a new tab with `rel="noopener noreferrer"`

## Button component

`button` is generated by the shadcn CLI and is the first primitive in the repo. Per the
project naming rule the file is `button.tsx`, which is already snake_case-safe.

Variants required on the page, using shadcn's own names so the CLI can still update the
component:

| Variant | Used for |
| --- | --- |
| `default` | the primary action. This is the primary variant; the project does not rename it. |
| `secondary` | lower-emphasis actions |
| `outline` | the hero's secondary CTA |
| `ghost` | nav anchors |
| `link` | footer links |
| `destructive` | not used on this page, but must remain intact for later |

Sizes `sm`, `default`, `lg`, and `icon` must all render correctly.

Every variant gets `transform: scale(0.97)` on `:active` with a ~160 ms ease-out
transition, so pressing feels acknowledged. Hover effects are gated behind
`@media (hover: hover) and (pointer: fine)` so tapping on a phone does not leave a stuck
hover state.

## Motion

Restrained. The page is seen once or twice, so entrance motion is justified, but nothing
decorative that repeats.

- Section content fades up on scroll into view, once, never replaying: `opacity 0 → 1`
  and `translateY(8px) → 0`
- Feature cards stagger at 50 ms intervals
- Transitions name their properties. No `transition: all`.
- Entrances use `ease-out` with a custom curve; `ease-in` is never used
- Durations stay under 300 ms except the scroll reveal, which may reach 400 ms
- Only `transform` and `opacity` animate
- `@media (prefers-reduced-motion: reduce)` keeps opacity fades and drops all movement

## Layout rules

Per CLAUDE.md: fluid primitives only. `w-full`, percentages, flex, grid, responsive
variants, `h-auto`, `aspect-*`, and `max-w-*`/`max-h-*` for constraint. Fixed dimensions
are permitted only on icons. No arbitrary `w-[...]`, `h-[...]`, or `size-[...]` on
non-icon elements.

Breakpoints: single column under `sm`, two-column cards at `md`, three at `lg`.
Side gutters never collapse to zero, and the page never scrolls horizontally.

## Acceptance criteria

The page is done when all of the following hold.

1. `/` renders through TanStack Router with no console errors or warnings
2. All eight sections are present, in order, with the copy above
3. The logo renders in the nav, the footer, and as the browser tab favicon
4. `src/index.css` carries a purple ramp for both `:root` and `.dark`, and no component
   contains a colour literal
5. Every listed button variant and size appears on the page and is visibly distinct
6. Buttons scale to 0.97 on press
7. The footer shows Privacy and Terms as `#` links, plus the GitHub attribution link
8. No horizontal scroll at 320 px, 768 px, 1024 px, or 1440 px
9. Light and dark mode are both legible, with no unreadable text in either
10. With reduced motion enabled, no element translates
11. `npm run build`, `npm run lint`, and `npm test` all exit 0
