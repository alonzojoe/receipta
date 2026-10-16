# Validation: timeline tracking colour

Measured in Chromium on a production build of this branch, at 1280px, in both themes.
Every colour is resolved through a canvas, because Chrome reports computed colours as
`oklch()` and parsing those strings as RGB produces nonsense. Figures are sampled from
the rendered element, not calculated from the token values - the spec's own numbers were
calculations and two of them were out by a visible margin.

## What changed

| Element | Before | After |
| --- | --- | --- |
| Active step's disc, dark | outline, `bg-card` with a violet number | **filled** `--brand-fill` with white content |
| Active step's disc, light | outline, violet number | unchanged |
| Rail progress line | `bg-primary` | `bg-brand-fill` |
| Card header progress bar | `bg-primary` | `bg-brand-fill` |
| Everything else in the rail | - | unchanged |

Unchanged on purpose, per the author's "no other change": the completed discs and their
hover, the active disc's lavender rim and halo, the active row's tint and left edge, the
compact strip below 1024px, and the focus ring.

## Measured

### Dark

| Pair | Measured | Required | Result |
| --- | --- | --- | --- |
| Active disc fill | `rgb(96, 49, 241)` | the logo mark's violet | **exact** |
| White content on the active fill | **6.55:1** | 4.5:1 | pass |
| Active fill vs the card | 2.69:1 | - | see exception |
| Active disc's lavender rim vs the card | **6.50:1** | 3:1 | pass |
| Rim vs the fill it encloses | 2.41:1 | - | not load-bearing |
| Progress line and header bar | `rgb(96, 49, 241)` | the logo mark's violet | **exact** |
| Progress vs the card | 2.69:1 | - | see exception |
| **Progress fill vs its own empty track** | **1.89:1** | - | **accepted, see below** |
| Completed discs (unchanged) | content 6.07:1, rim 3.77:1 | - | unmoved |

### Light

| Pair | Measured | Result |
| --- | --- | --- |
| Active disc fill | `rgb(255, 255, 255)` | unchanged |
| Active disc content and rim | `rgb(107, 58, 237)`, 6.08:1 | unchanged |
| Progress line and header bar | `rgb(107, 58, 237)`, 4.10:1 on its track | unchanged |
| Completed discs | content 4.90:1, rim 3.64:1 | unmoved |

Light is unchanged by construction, not by coincidence: `--brand-fill` is `var(--primary)`
in `:root`, and the active disc's violet fill is behind `dark:` variants only.

## The exception, stated plainly

The active fill and the progress measure **2.69:1 against the card**, below the 3:1 that
1.4.11 asks of a graphic needed to understand content. Both are accepted, for different
reasons:

- **The active disc** is not identified by its fill. Its edge is the lavender rim at
  6.50:1, its content is white at 6.55:1, its row carries a tint and a left edge marker,
  and its state reaches a screen reader as text. The violet is the brand reading the
  author asked for, carried by an element whose legibility does not depend on it.
- **The progress line and bar** are non-interactive, bound no control, and duplicate state
  that is also in the disc shapes and in the visible "Step n of 4". This is the narrow
  exception the spec records, and it is noted beside the token in `index.css` so the next
  person to reuse `--brand-fill` as ink finds the reasoning rather than the precedent.

### The figure that was missing, and the author's decision on it

The first version of this document recorded the progress against the *card* (2.69:1) and
never measured it against **its own empty track**, which is the pair that actually shows
how far along the bar is. Review caught the omission. Measured from composited pixels,
with the bar 25% filled:

| | Filled | Empty track | Fill vs track |
| --- | --- | --- | --- |
| Dark | `rgb(96, 49, 241)` | `rgb(47, 53, 61)` | **1.89:1** |
| Light | `rgb(107, 58, 237)` | `rgb(203, 213, 225)` | 4.10:1 |

Lavender gave roughly 4.5:1 in dark, so this is a real loss: the filled and empty halves
of the bar now differ far less than they did. Both colours are dark, and contrast between
two dark colours is inherently low - no arrangement of this violet on this track reaches
3:1 without changing one of them.

**The author accepted it as it stands** ("accept as it is for now"), having been shown the
measured figures and the alternatives. Nothing is required to change: the bar is
`aria-hidden`, and "Step n of 4" states the same information as text immediately beside
it, so 1.4.11 does not apply. The honest description is that the bar is now a weaker
gauge than it was, and reads more as decoration than as a measure.

Two fixes were offered and declined for now, and stay available: darkening the dark-mode
track so the violet reads against it as an inset groove (about 3:1), or keeping the bar
lavender while the active disc alone takes the violet. Both are in Deferred.

A lighter violet for the line is also Deferred, to be settled by eye on a real display
rather than by another calculation.

## Non-regression

- **Criterion 54 (focus ring):** `--ring` is not edited and `focus-visible:ring-ring` is
  untouched, so yesterday's 6.08/6.50:1 stands by construction.
- **Criterion 70 (control borders):** `--control-border` is not edited. The completed and
  upcoming discs measure 3.77:1 dark and 3.64:1 light, as before.
- **The Button:** `--button` is now an alias of `--brand-fill` and `button.tsx` is not
  touched, so its classes are byte-identical. The guard test in `button.test.tsx` now pins
  the whole alias chain in both `:root` and `.dark`, rather than only the end of it.

## Two violets in one rail

Completed steps are lavender while the active step and the progress are the mark violet.
That is the author's instruction - "the active one change only the color" and "and the
progress" - recorded as a decision, not an oversight. Whether the completed discs should
follow is Deferred and wants a look on screen.

## Guard test

`step_timeline.test.tsx` pins the class division, because the failures it guards are
silent in two directions: dropping `dark:bg-brand-fill` leaves the disc lavender with
nothing failing, and writing `bg-brand-fill` *without* the `dark:` prefix repaints the
disc in light mode, where the spec requires no change. Neither is visible to a
behavioural test or to a reader of the diff.

Five mutations, each applied, run and reverted:

| Mutation | Caught by |
| --- | --- |
| `dark:` prefix dropped from the fill | 2 tests |
| the fill removed entirely | 1 test |
| the rim recoloured to `brand-fill` (ink misuse) | 1 test |
| the progress line returned to `bg-primary` | 1 test |
| a completed disc recoloured (out of scope) | 2 tests |

## Not verified

- No screen-reader pass, and no real-display look at the two violets side by side.
- Chromium only. Safari and iOS unverified, as with the rest of this feature.
- `npm run build`, `npm run lint`, `npm test` all exit 0 (609 tests in 44 files).
