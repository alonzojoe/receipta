# Home Page — Validation

How the work gets proven. Every check is either an automated test or a command whose
output is recorded. Nothing is marked done on the strength of looking at it once.

Fill the Result column in as each check runs. `—` means not yet run.

## Gate 0 — Commands

Must all pass before the PR opens. Exit codes, not impressions.

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0, all pass | — |
| No test code shipped | `grep -rl "\.test\." dist/` | no matches | — |

## Gate 1 — Automated tests

Written as part of the tasks that introduce the code.

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| T1 | `button` variants | each of `default`, `secondary`, `outline`, `ghost`, `link`, `destructive` renders a distinct class string | — |
| T2 | `button` sizes | `sm`, `default`, `lg`, `icon` each render distinctly | — |
| T3 | `button` press | the active-scale class is present on every variant | — |
| T4 | `reveal` reduced motion | no translate class when `prefers-reduced-motion: reduce` | — |
| T5 | footer attribution | GitHub link `href` is `https://github.com/alonzojoe`, `target="_blank"`, `rel` contains `noopener` and `noreferrer` | — |
| T6 | footer placeholders | Privacy Policy and Terms & Conditions both render with `href="#"` | — |
| T7 | hero currency | the mock receipt contains `₱` and a comma-grouped, two-decimal amount | — |
| T8 | feature grid | the rendered card count equals the config array length | — |
| T9 | page composition | all eight section headings render in document order | — |
| T10 | routes | `/` renders home, `/create` renders the placeholder, an unknown path renders not-found | — |
| T11 | single h1 | exactly one `<h1>` on the page | — |

## Gate 2 — Contrast

Measured, not eyeballed. Computed from the oklch token values with a contrast script, and
the ratios recorded here.

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

A failure here is a token change, not a component change.

## Gate 3 — Responsive

Checked in a real browser at each width. Horizontal overflow is a failure, not a nitpick.

| Width | No h-scroll | Layout correct | Gutters intact | Result |
| --- | --- | --- | --- | --- |
| 320 px | | | | — |
| 375 px | | | | — |
| 768 px | | | | — |
| 1024 px | | | | — |
| 1440 px | | | | — |

Overflow is diagnosed with, not guessed at:

```js
[...document.querySelectorAll('*')].filter(e => e.scrollWidth > document.documentElement.clientWidth)
```

## Gate 4 — Layout rule compliance

CLAUDE.md forbids arbitrary dimensions on non-icon elements.

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | matches only on icons, each justified | — |
| No colour literals | `grep -rnE '#[0-9a-fA-F]{3,8}\b\|rgb\(\|oklch\(' src/ --include=*.tsx` | only the mock receipt's deliberate document colours | — |
| Tokens centralised | all colour tokens defined in `src/index.css` | no token defined elsewhere | — |

## Gate 5 — Motion

Reviewed against the animation rules, with fresh eyes on a second pass rather than
immediately after writing it.

| Check | Expected | Result |
| --- | --- | --- |
| No `transition: all` | properties always named | — |
| No `ease-in` on entrances | `ease-out` or the custom curve | — |
| Durations | under 300 ms, except scroll reveal up to 400 ms | — |
| Animated properties | `transform` and `opacity` only | — |
| No `scale(0)` entrances | start at `scale(0.95)` or higher | — |
| Stagger interval | 30–80 ms between cards | — |
| Reveal plays once | does not replay on scroll back | — |
| Reduced motion | opacity retained, all movement dropped | — |
| Hover gated | `@media (hover: hover) and (pointer: fine)` | — |
| Press feedback | every button scales on `:active` | — |

## Gate 6 — Accessibility

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Heading order | read the outline | one `h1`, no skipped levels | — |
| Keyboard order | tab through the page | logical, no traps | — |
| Focus visible | tab to every interactive element | ring always visible, both modes | — |
| Link purpose | read each link out of context | destination is clear | — |
| Icon-only controls | inspect | each has an accessible name | — |
| External link | footer GitHub | `rel="noopener noreferrer"` | — |
| Images | inspect | decorative marked `aria-hidden`, meaningful ones labelled | — |
| Zoom | browser zoom to 200% | no clipping, no overflow | — |

## Gate 7 — Favicon and metadata

| Check | Expected | Result |
| --- | --- | --- |
| `public/favicon.svg` | Receipta mark, not the Vite logo | — |
| `index.html` link tag | `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` | — |
| Tab rendering | mark legible at 16 px in a real tab | — |
| `<title>` | reads as Receipta, not the scaffold default | — |

## Gate 8 — Content

| Check | Expected | Result |
| --- | --- | --- |
| Sections | all eight present, in the specified order | — |
| Copy | matches `requirements.md`; no lorem ipsum | — |
| Payment modes | GCash, Maya, MariBank, Bank Transfer, all four | — |
| Peso format | every amount shown as `₱1,234.56` | — |
| Placeholder honesty | Privacy and Terms are `#` by design; `/create` reads as deliberate, not broken | — |
| No invented brand marks | no fabricated provider logos stand in for official assets | — |

## Known deferrals

Recorded so they are not mistaken for oversights.

- **Privacy and Terms pages do not exist.** Links are `#` by explicit decision.
- **`/create` is a placeholder.** The builder is Phase 1.
- **Payment provider logos are absent.** Text labels until official brand assets are
  sourced; the strip is built to accept them.
- **No analytics, no SEO beyond title and favicon, no social preview image.**

## Sign-off

The PR may not be marked ready until every Result cell reads pass or is explicitly
accepted as a deferral above. A partially filled table means the work is not finished.
