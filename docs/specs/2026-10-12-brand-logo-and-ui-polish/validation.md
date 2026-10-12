# Brand Logo and UI Polish — Validation

Every check is a command, a test, or a rendered image that was actually looked at.
`not run` is a valid result and is preferred over an optimistic tick.

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — Assets

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Icons exist | `ls public/` | apple-touch-icon, icon-192, icon-512, favicon.svg, site.webmanifest | — |
| Transparent corners | sample pixel (0,0) of each PNG | alpha 0 | — |
| Correct dimensions | `magick identify` | 180, 192, 512, 256 | — |
| No stale asset | `grep -rn "favicon" index.html public/` | no reference to a deleted file | — |
| Manifest valid | parse as JSON, resolve every icon path | parses, all paths exist | — |

## Gate 2 — Favicon legibility

The previous logo shipped having failed this, so it is checked by rendering, not by
reasoning.

| Size | Expected | Result |
| --- | --- | --- |
| 16px | receipt silhouette and badge distinguishable | — |
| 32px | rules and badge clearly separated | — |
| 180px (apple touch) | full artwork, including sparkle | — |

## Gate 3 — Contrast at hue 287

Re-measured after the hue shift. Carrying the old numbers forward would not be a
measurement.

| Pair | Mode | Minimum | Measured | Result |
| --- | --- | --- | --- | --- |
| `--foreground` on `--background` | light | 4.5:1 | — | — |
| `--foreground` on `--background` | dark | 4.5:1 | — | — |
| `--primary-foreground` on `--primary` | light | 4.5:1 | — | — |
| `--primary-foreground` on `--primary` | dark | 4.5:1 | — | — |
| `--muted-foreground` on `--background` | light | 4.5:1 | — | — |
| `--muted-foreground` on `--background` | dark | 4.5:1 | — | — |
| `--foreground` on `--card` | light | 4.5:1 | — | — |
| `--foreground` on `--card` | dark | 4.5:1 | — | — |

## Gate 4 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| L1 | logo renders artwork | `LogoMark` renders an image with a non-empty src | — |
| L2 | logo is decorative | the mark is `aria-hidden`; the name comes from the wordmark | — |
| L3 | logo sizing | a caller class reaches the element | — |
| L4 | header scrolled state | the scrolled attribute flips when the sentinel leaves view | — |
| L5 | no scroll listener | the header attaches no `scroll` handler to `window` | — |
| L6 | existing suite | every test from the home page spec still passes | — |

## Gate 5 — Responsive

Measured in an iframe, which genuinely reflows, reading `scrollWidth` against
`clientWidth` plus any element whose right edge exceeds the viewport.

| Width | No h-scroll | Overflowing elements | Result |
| --- | --- | --- | --- |
| 320 px | | | — |
| 375 px | | | — |
| 768 px | | | — |
| 1024 px | | | — |

## Gate 6 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | — |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the mock receipt's document colours | — |
| No `transition: all` | `grep -rn "transition-all" src/` | none | — |
| No `ease-in` | `grep -rnE 'ease-in\b' src/` | none outside comments | — |
| snake_case files | inspect `src/` | every file snake_case | — |
| Gradients centralised | `grep -rn "linear-gradient" src/` | defined in `index.css`, not per component | — |

## Gate 7 — Visual

Rendered and looked at, not inferred.

| Check | Expected | Result |
| --- | --- | --- |
| Light mode | full page reads correctly | — |
| Dark mode | full page reads correctly; mark unchanged by theme | — |
| Header at rest | transparent over the hero | — |
| Header scrolled | border and blur present | — |
| Card hover | shadow and border change, no layout shift | — |
| Payment strip | reads as a deliberate band | — |

## Gate 8 — Motion

| Check | Expected | Result |
| --- | --- | --- |
| Named properties | no `transition: all` | — |
| Durations | under 300ms except the 400ms reveal | — |
| Animated properties | `transform` and `opacity`, plus colour on hover | — |
| Header transition | background, border and blur only | — |
| Reduced motion | all movement dropped, fades kept | — |

## Known deferrals

- `/create` is still a placeholder; the builder is Phase 1.
- Privacy and Terms remain `#`.
- Payment providers remain text labels; no logo is invented.
- No theme toggle yet.
- The mark is a raster. Acceptable at its current sizes; a large-format use would
  justify commissioning a vector.

## Sign-off

Not ready until every Result cell holds a measurement, or an explicit `not run` listed
under deferrals. A half-filled table means the work is not finished.
