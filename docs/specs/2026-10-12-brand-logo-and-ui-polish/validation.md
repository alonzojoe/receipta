# Brand Logo and UI Polish — Validation

Every check is a command, a test, or a rendered image that was actually looked at.
`not run` is a valid result and is preferred over an optimistic tick.

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 35 tests, 8 files |

## Gate 1 — Assets

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Icons exist | `ls public/` | apple-touch-icon, icon-192, icon-512, favicon PNGs, favicon.ico, site.webmanifest | pass - plus logo_lockup.png. `favicon.svg` removed when the tab icon moved to the real artwork. |
| Transparent corners | sample pixel (0,0) of each PNG | alpha 0 | pass - all five PNGs read `srgba(0,0,0,0)` |
| Correct dimensions | `magick identify` | 180, 192, 512, 256 | pass - plus lockup at 1200x399 |
| No stale asset | `grep -rn "favicon" index.html public/` | no reference to a deleted file | pass - every href in `index.html` resolves to a file on disk, checked by script |
| Manifest valid | parse as JSON, resolve every icon path | parses, all paths exist | pass |

## Gate 2 — Favicon legibility

The previous logo shipped having failed this, so it is checked by rendering, not by
reasoning.

| Size | Expected | Result |
| --- | --- | --- |
| 16px | receipt silhouette distinguishable | pass with a caveat - rasterised and inspected. The real artwork at 16px is soft: the receipt shape reads, the badge only faintly. Accepted so that the tab icon is the actual mark rather than a lookalike; retina displays use the 32px icon. |
| 32px | rules and badge clearly separated | pass - real artwork, crisp. This is what retina tabs show. |
| 180px (apple touch) | full artwork, including sparkle | pass - real artwork, not the simplified draw |

## Gate 3 — Contrast at hue 287

Re-measured after the hue shift. Carrying the old numbers forward would not be a
measurement.

| Pair | Mode | Minimum | Measured | Result |
| --- | --- | --- | --- | --- |
| `--foreground` on `--background` | light | 4.5:1 | 18.19:1 | pass |
| `--foreground` on `--background` | dark | 4.5:1 | 17.67:1 | pass |
| `--primary-foreground` on `--primary` | light | 4.5:1 | 5.42:1 | pass |
| `--primary-foreground` on `--primary` | dark | 4.5:1 | 6.71:1 | pass |
| `--muted-foreground` on `--background` | light | 4.5:1 | 6.19:1 | pass |
| `--muted-foreground` on `--background` | dark | 4.5:1 | 7.73:1 | pass |
| `--foreground` on `--card` | light | 4.5:1 | 18.51:1 | pass |
| `--foreground` on `--card` | dark | 4.5:1 | 16.45:1 | pass |

## Gate 4 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| L1 | logo renders artwork | `LogoMark` renders an image with a non-empty src | pass |
| L2 | logo is decorative | the mark is `aria-hidden`; the name comes from the wordmark | pass |
| L3 | logo sizing | a caller class reaches the element | pass - plus intrinsic width/height against layout shift |
| L4 | header scrolled state | the scrolled attribute flips when the sentinel leaves view | pass - measured live: scrollY 0 -> `false`, 800 -> `true`, back to 0 -> `false` |
| L5 | no scroll listener | the header attaches no `scroll` handler to `window` | pass - asserted with a spy |
| L6 | existing suite | every test from the home page spec still passes | pass - heading-order test updated for the new FAQ section |

## Gate 5 — Responsive

Measured in an iframe, which genuinely reflows, reading `scrollWidth` against
`clientWidth` plus any element whose right edge exceeds the viewport.

| Width | No h-scroll | Overflowing elements | Result |
| --- | --- | --- | --- |
| 320 px | yes | none | pass |
| 375 px | yes | none | pass |
| 768 px | yes | none | pass |
| 1024 px | yes | none | pass |

## Gate 6 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | pass - zero matches |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the mock receipt's document colours | pass - 13 matches, all in `mock_receipt.tsx` |
| No `transition: all` | `grep -rn "transition-all" src/` | none | pass - zero outside the test asserting its absence |
| No `ease-in` | `grep -rnE 'ease-in\b' src/` | none outside comments | pass - 2 matches, both comments stating it is never used |
| snake_case files | inspect `src/` | every file snake_case | pass |
| Gradients centralised | `grep -rn "linear-gradient" src/` | defined in `index.css`, not per component | pass - zero outside `index.css` |

## Gate 7 — Visual

Rendered and looked at, not inferred.

| Check | Expected | Result |
| --- | --- | --- |
| Light mode | full page reads correctly | pass |
| Dark mode | full page reads correctly; mark unchanged by theme | partial - the dark footer was rendered and inspected, and the mark is unchanged by theme by construction. A full dark-mode pass of every section was not repeated. |
| Header at rest | transparent over the hero | pass |
| Header scrolled | border and blur present | pass |
| Card hover | shadow and border change, no layout shift | not run - hover not exercised in a real pointer session |
| Payment strip | reads as a deliberate band | pass - labels are now bordered pills |

## Gate 8 — Motion

| Check | Expected | Result |
| --- | --- | --- |
| Named properties | no `transition: all` | pass |
| Durations | under 300ms except the 400ms reveal | pass - 150ms buttons, 200ms cards and header, 450ms reveal |
| Animated properties | `transform` and `opacity`, plus colour on hover | pass - the reveal animates a full `transform` string, not Framer's main-thread `y` shorthand |
| Header transition | background, border and blur only | pass |
| Reduced motion | all movement dropped, fades kept | pass by construction - `MotionConfig reducedMotion="user"` at the root plus `useReducedMotion` in the reveal |

## Not verified

- **Card hover** was not exercised with a real pointer. Only `box-shadow` and
  `border-color` transition, neither of which can shift layout, but that is reasoning
  rather than observation.
- **A full dark-mode sweep** of every section was not repeated after the hue shift. The
  dark footer was rendered and checked; the rest rests on the measured contrast table.
- **The browser window would not resize**, so the live visual checks were done at
  413px. Wider layouts were measured in a reflowing iframe instead, which catches
  overflow but not visual judgement.

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
