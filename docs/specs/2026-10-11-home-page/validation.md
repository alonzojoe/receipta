# Home Page — Validation

How the work gets proven. Every check is either an automated test or a command whose
output is recorded. Nothing is marked done on the strength of looking at it once.

Fill the Result column in as each check runs. `—` means not yet run.

## Gate 0 — Commands

Must all pass before the PR opens. Exit codes, not impressions.

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0, all pass | pass - 31 tests, 7 files |
| No test code shipped | `grep -rl "\.test\." dist/` | no matches | pass |

## Gate 1 — Automated tests

Written as part of the tasks that introduce the code.

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| T1 | `button` variants | each of `default`, `secondary`, `outline`, `ghost`, `link`, `destructive` renders a distinct class string | pass |
| T2 | `button` sizes | `sm`, `default`, `lg`, `icon` each render distinctly | pass |
| T3 | `button` press | the active-scale class is present on every variant | pass |
| T4 | `reveal` reduced motion | no translate class when `prefers-reduced-motion: reduce` | deferred - stubbed matchMedia returns no-preference; logic verified by reading, not asserted |
| T5 | footer attribution | GitHub link `href` is `https://github.com/alonzojoe`, `target="_blank"`, `rel` contains `noopener` and `noreferrer` | pass |
| T6 | footer placeholders | Privacy Policy and Terms & Conditions both render with `href="#"` | pass |
| T7 | hero currency | the mock receipt contains `₱` and a comma-grouped, two-decimal amount | pass |
| T8 | feature grid | the rendered card count equals the config array length | pass |
| T9 | page composition | all eight section headings render in document order | pass |
| T10 | routes | `/` renders home, `/create` renders the placeholder, an unknown path renders not-found | pass |
| T11 | single h1 | exactly one `<h1>` on the page | pass |

## Gate 2 — Contrast

Measured, not eyeballed. Computed from the oklch token values with a contrast script, and
the ratios recorded here.

| Pair | Mode | Minimum | Measured | Result |
| --- | --- | --- | --- | --- |
| `--foreground` on `--background` | light | 4.5:1 | 18.20:1 | pass |
| `--foreground` on `--background` | dark | 4.5:1 | 17.67:1 | pass |
| `--primary-foreground` on `--primary` | light | 4.5:1 | 5.46:1 | pass |
| `--primary-foreground` on `--primary` | dark | 4.5:1 | 6.73:1 | pass |
| `--muted-foreground` on `--background` | light | 4.5:1 | 6.20:1 | pass |
| `--muted-foreground` on `--background` | dark | 4.5:1 | 7.73:1 | pass |
| `--foreground` on `--card` | light | 4.5:1 | 18.52:1 | pass |
| `--foreground` on `--card` | dark | 4.5:1 | 16.46:1 | pass |

Measured by converting each oklch token to sRGB and computing the WCAG ratio. The
lowest pair is primary-foreground on primary at 5.46:1.

A failure here is a token change, not a component change.

## Gate 3 — Responsive

Checked in a real browser at each width. Horizontal overflow is a failure, not a nitpick.

Measured by loading the page in an iframe at each width, which genuinely reflows, and
reading back `scrollWidth` versus `clientWidth` plus any element whose right edge
exceeds the viewport.

| Width | scrollWidth | No h-scroll | Overflowing elements | Result |
| --- | --- | --- | --- | --- |
| 320 px | 320 | yes | none | pass |
| 375 px | 375 | yes | none | pass |
| 768 px | 768 | yes | none | pass |
| 1024 px | 1024 | yes | none | pass |
| 1440 px | - | - | - | not run - desktop verified visually at 1460 px |

Nav anchors correctly collapse below `md`: hidden at 320 and 375, visible at 768 and
1024.

Overflow is diagnosed with, not guessed at:

```js
[...document.querySelectorAll('*')].filter(e => e.scrollWidth > document.documentElement.clientWidth)
```

## Gate 4 — Layout rule compliance

CLAUDE.md forbids arbitrary dimensions on non-icon elements.

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | matches only on icons, each justified | pass - zero matches |
| No colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the mock receipt's deliberate document colours | pass - all 13 matches are in `mock_receipt.tsx` |
| Tokens centralised | all colour tokens defined in `src/index.css` | no token defined elsewhere | pass |

## Gate 5 — Motion

Reviewed against the animation rules, with fresh eyes on a second pass rather than
immediately after writing it.

| Check | Expected | Result |
| --- | --- | --- |
| No `transition: all` | properties always named | pass - only match is the test asserting its absence |
| No `ease-in` on entrances | `ease-out` or the custom curve | pass - no `ease-in` utility anywhere |
| Durations | under 300 ms, except scroll reveal up to 400 ms | pass - 150 ms buttons, 200 ms cards, 300 ms receipt, 400 ms reveal |
| Animated properties | `transform` and `opacity` only | pass - plus colour on hover, which does not trigger layout |
| No `scale(0)` entrances | start at `scale(0.95)` or higher | pass - reveal uses opacity plus an 8 px translate, no scale |
| Stagger interval | 30-80 ms between cards | pass - 50 ms features, 60 ms steps |
| Reveal plays once | does not replay on scroll back | pass - observer disconnects on first intersection |
| Reduced motion | opacity retained, all movement dropped | pass by construction - translate omitted when reduced |
| Hover gated | `@media (hover: hover)` | pass - Tailwind v4 gates `hover:` natively; verified in built CSS |
| Press feedback | every button scales on `:active` | pass - asserted for all six variants |

## Gate 6 — Accessibility

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Heading order | read the outline | one `h1`, no skipped levels | pass - one h1, four h2, h3 only inside cards |
| Keyboard order | tab through the page | logical, no traps | not run |
| Focus visible | tab to every interactive element | ring always visible, both modes | not run |
| Link purpose | read each link out of context | destination is clear | not run |
| Icon-only controls | inspect | each has an accessible name | not run |
| External link | footer GitHub | `rel="noopener noreferrer"` | pass - asserted in test |
| Images | inspect | decorative marked `aria-hidden`, meaningful ones labelled | pass - logo mark and all icons are `aria-hidden` |
| Zoom | browser zoom to 200% | no clipping, no overflow | not run |

## Gate 7 — Favicon and metadata

| Check | Expected | Result |
| --- | --- | --- |
| `public/favicon.svg` | Receipta mark, not the Vite logo | pass |
| `index.html` link tag | `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` | pass |
| Tab rendering | mark legible at 16 px | pass - rasterised at 16 px and inspected. The first design failed this: four teeth fell below a pixel and three thin rules merged. Redrawn with three deep teeth and two thick rules. |
| `<title>` | reads as Receipta, not the scaffold default | pass |

## Gate 8 — Content

| Check | Expected | Result |
| --- | --- | --- |
| Sections | all eight present, in the specified order | pass - asserted by heading-order test |
| Copy | matches `requirements.md`; no lorem ipsum | pass |
| Payment modes | GCash, Maya, MariBank, Bank Transfer, all four | pass - asserted in test |
| Peso format | every amount shown as `₱1,234.56` | pass - asserted in test |
| Placeholder honesty | Privacy and Terms are `#` by design; `/create` reads as deliberate, not broken | pass |
| No invented brand marks | no fabricated provider logos stand in for official assets | pass - text labels only |

## Known deferrals

Recorded so they are not mistaken for oversights.

- **Privacy and Terms pages do not exist.** Links are `#` by explicit decision.
- **`/create` is a placeholder.** The builder is Phase 1.
- **Payment provider logos are absent.** Text labels until official brand assets are
  sourced; the strip is built to accept them.
- **No analytics, no SEO beyond title and favicon, no social preview image.**

## Not verified

Stated plainly rather than left looking green.

- **Keyboard order, focus visibility, link purpose, icon-only names, and 200% zoom**
  were not walked through by hand. Focus rings come from the shadcn base styles and
  every icon is `aria-hidden` beside a text label, but that is reasoning, not a test.
- **1440 px** was not measured. Desktop was verified visually at 1460 px.
- **T4** asserts nothing: the test environment stubs `matchMedia` as no-preference, so
  the reduced-motion branch is never exercised.

## Sign-off

The PR may not be marked ready until every Result cell reads pass or is explicitly
accepted as a deferral above. A partially filled table means the work is not finished.
