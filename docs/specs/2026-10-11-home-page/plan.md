# Home Page — Implementation Plan

Branch `feature/home-page`, cut from `develop`. PR title is the branch name.

Eleven tasks, ordered so each one builds on a working tree. Every task ends with
`npm run build`, `npm run lint`, and `npm test` passing before the next begins.

## Architecture

Feature Sliced Design v1. This page introduces the layer structure, so the boundaries set
here govern everything after it.

```
src/
  app/
    router.tsx              router instance and route tree
    routes/
      root_route.tsx        shell: outlet + toaster
      home_route.tsx        / -> home_page
      create_route.tsx      /create -> placeholder until Phase 1
  pages/
    home/
      ui/home_page.tsx      composes the widgets, owns nothing else
      index.ts              public api
  widgets/
    site_header/            nav
    site_footer/            footer
    home_hero/              hero + mock receipt
    home_steps/             how it works
    home_features/          feature card grid
    home_payment_modes/     payment strip
    home_privacy/           privacy block
    home_closing_cta/       closing cta
  shared/
    ui/
      button.tsx            shadcn generated
      logo.tsx              mark, wordmark, combined
      section.tsx           section wrapper: gutters, max width, vertical rhythm
      reveal.tsx            scroll-into-view fade-up wrapper
    config/
      site.ts               author name, github url, nav items, payment mode labels
    lib/
      utils.ts              existing cn()
```

Import rule, enforced by review: `app` -> `pages` -> `widgets` -> `shared`. A widget
never imports another widget. Nothing imports upward. `shared` imports nothing from the
layers above it.

`src/App.tsx` is deleted; `src/main.tsx` mounts the router instead.

## Task 1 — Purple theme tokens

Replace shadcn's neutral ramp in `src/index.css` with a violet ramp at hue ~295, for both
`:root` and `.dark`. Keep every token name and the `@theme inline` mapping exactly as
shadcn generated them, so generated components keep working — only the values change.

Add the custom easing curves as CSS variables alongside the colour tokens:
`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and
`--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`.

**Verify:** contrast-check `--foreground` on `--background` and
`--primary-foreground` on `--primary` in both modes, each at 4.5:1 or better. Record the
measured ratios in `validation.md`.

## Task 2 — Button primitive

`npx shadcn@latest add button`, then rename if the CLI emits a multi-word filename (it
does not for `button`) and move it to `src/shared/ui/button.tsx`, fixing the import of
`cn`.

Extend the variant styles with press feedback: `active:scale-[0.97]` and
`transition-transform` at ~160 ms using `--ease-out`. Gate hover styles behind
`@media (hover: hover) and (pointer: fine)`.

**Verify:** a unit test renders every variant and size and asserts each applies a distinct
class string.

## Task 3 — Logo and favicon

`src/shared/ui/logo.tsx` exporting `logo_mark`, `logo_wordmark`, and `logo`. The mark is a
rounded square with a receipt glyph and a zigzag torn bottom edge, drawn with
`currentColor` so it themes automatically. No fixed pixel size inside the component; the
caller sizes it, and icons are the one place fixed dimensions are allowed.

Write `public/favicon.svg` with the same mark, hardcoded to the brand violet since it
cannot inherit a theme, and replace the Vite favicon. Confirm `index.html` carries
`<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. Update `<title>`.

**Verify:** render the mark at 16 px and confirm the zigzag is still readable.

## Task 4 — Router

Create the router instance and three routes. `/create` renders a plain placeholder that
says the builder is coming, so the hero CTA leads somewhere honest rather than a 404.

Delete `src/App.tsx` and `src/App.css` remnants. `src/main.tsx` renders
`<RouterProvider />` inside `<StrictMode>`, and mounts `<Toaster />` from
react-hot-toast in the root route so later features can toast without rewiring.

Code-based routes, not file-based: no extra plugin, no generated route tree, and route
definitions sit naturally in the `app` layer. Revisit only if the route count grows past
roughly ten.

**Verify:** `/` renders, `/create` renders the placeholder, an unknown path renders a
not-found, and the console is clean.

## Task 5 — Shared layout primitives

`section.tsx` owns horizontal gutters, `max-w-*` content width, and vertical rhythm, so no
widget reinvents page padding. `reveal.tsx` wraps children in a scroll-triggered fade-up
using `IntersectionObserver` with `{ once: true }`, reading `prefers-reduced-motion` and
dropping the translate when set.

`shared/config/site.ts` holds the author name, GitHub URL, nav items, footer links, and
payment mode labels, so no widget hardcodes a string that appears twice.

**Verify:** `reveal` tests assert the translate class is absent when reduced motion is
preferred.

## Task 6 — Header and footer

`site_header`: logo, anchor links as `ghost` buttons, and a `default` button CTA. Anchors
hide below `md`.

`site_footer`: logo with descriptor, Privacy `#` and Terms `#` as `link` buttons, and the
attribution line — "Built by Joenell Canlas Alonzo" with a react-icons GitHub mark linking
to `https://github.com/alonzojoe`, `target="_blank"` and `rel="noopener noreferrer"`.

**Verify:** a test asserts the GitHub link's `href`, `target`, and `rel`, and that both
placeholder links are present.

## Task 7 — Hero

Headline, subheadline, the two CTAs, and the mock receipt. The mock is real markup, not an
image: issuer, client, two item rows with quantity and unit price, a discount line, a
total, a payment mode, and a reference number — formatted with
`Intl.NumberFormat('en-PH')` so the peso rendering is proven here before the builder needs
it.

The mock receipt uses fixed light surface colours, not theme tokens, because a receipt is
a document and must look the same in dark mode. This also matches the export decision in
`tech-stack.md`, where theme tokens must not reach the rasterised node.

**Verify:** the rendered mock contains `₱` and a correctly grouped amount.

## Task 8 — Steps, features, payment modes

Three widgets from the copy in `requirements.md`. Feature icons come from react-icons.
Cards stagger at 50 ms. The payment strip renders labels from `site.ts` and is structured
so a logo component can slot in beside each label later without restructuring.

**Verify:** feature card count matches the config array; no card content is hardcoded
twice.

## Task 9 — Privacy block and closing CTA

Two short widgets. The closing CTA repeats the primary button.

## Task 10 — Page composition

`home_page.tsx` composes header, the six content widgets, and footer in order. It holds no
logic and no styling beyond ordering.

**Verify:** a test renders the page and asserts each section's heading is present, in
order.

## Task 11 — Responsive and accessibility pass

- Check 320, 768, 1024, 1440 px for horizontal overflow
- Confirm one `<h1>` only, and that heading levels do not skip
- Keyboard-tab the page: visible focus rings, logical order, no traps
- Toggle dark mode and re-read every section
- Toggle reduced motion and confirm nothing translates
- Confirm no arbitrary Tailwind dimensions on non-icon elements:
  `grep -rnE '\b(w|h|size)-\[' src/` returns only icon usages

## Risks

**The hero's mock receipt is a layout rehearsal, not the real component.** It will be
rewritten in Phase 1 against the real data model. Keeping it in the hero widget rather
than `entities/` makes that deletion cheap. Do not let the builder import it.

**The purple ramp is a brand decision made without a visual review.** Expect one round of
adjustment once it is on screen. Because every value is a token in one file, that round is
cheap — which is exactly why no component may hold a colour literal.

**The primary CTA points at an unbuilt route.** The `/create` placeholder must read as
deliberate, not broken.
