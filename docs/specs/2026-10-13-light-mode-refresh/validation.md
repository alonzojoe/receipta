# Light Mode Refresh — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 107 tests |

## Gate 1 — The problem is actually fixed

Measured, since "looks better" is not a result.

| Check | Before | Target | After | Result |
| --- | --- | --- | --- | --- |
| Card vs background separation | 1.047:1 | visibly layered | 1.047 unchanged; layering now comes from shadow and bands, not fill | pass |
| Shadows carry the brand hue | neutral black | violet-tinted | `oklch(0.42 0.14 287 / ...)` | pass |
| Tinted band present | none | at least one | two: steps and FAQ, at 1.078 vs background | pass |
| Accent panels present | none | privacy and closing CTA | both, at 1.114 vs background | pass |

## Gate 2 — Contrast, full cross product

Every foreground against every surface it can land on. New surfaces included.

| Foreground | Surface | Minimum | Measured | Result |
| --- | --- | --- | --- | --- |
| `--foreground` | `--background` | 4.5:1 | 14.03:1 | pass |
| `--foreground` | `--card` | 4.5:1 | 14.68:1 | pass |
| `--foreground` | `--muted` | 4.5:1 | 13.08:1 | pass |
| `--foreground` | `--surface-tint` | 4.5:1 | 13.01:1 | pass |
| `--foreground` | `--surface-accent` | 4.5:1 | 12.59:1 | pass |
| `--muted-foreground` | `--background` | 4.5:1 | 5.26:1 | pass |
| `--muted-foreground` | `--card` | 4.5:1 | 5.50:1 | pass |
| `--muted-foreground` | `--muted` | 4.5:1 | 4.90:1 | pass |
| `--muted-foreground` | `--surface-tint` | 4.5:1 | 4.88:1 | pass |
| `--muted-foreground` | `--surface-accent` | 4.5:1 | 4.72:1 | pass |
| `--primary-foreground` | `--primary` | 4.5:1 | 5.79:1 | pass |
| `--secondary-foreground` | `--secondary` | 4.5:1 | 10.57:1 | pass |

## Gate 3 — Dark mode is unchanged

The claim most likely to be quietly wrong, because shadow tokens are shared.

| Check | Expected | Result |
| --- | --- | --- |
| Dark home page, before vs after | visually identical apart from shadows | **changed** - see below |
| Dark shadows readable | not violet-on-dark, which is invisible | pass - overridden to neutral |
| Dark contrast pairs | unchanged from the brand refresh numbers | pass - plus the two new surfaces, all 14 measured |

## Gate 4 — Visual

| Check | Expected | Result |
| --- | --- | --- |
| Whole page, light | reads as layered bands, not one sheet | pass - rendered and inspected |
| Whole page, light, before/after | the difference is obvious | pass |
| Cards at rest | lifted, not outlined | pass |
| Card hover | shadow deepens, no layout shift | not run - hover not driven with a real pointer |
| Mock receipt | reads as a physical object | pass |
| Header scrolled | shadow present | pass |
| Not muddy | the aggregate is still clean | pass |
| Legal pages | inherit the treatment without looking odd | not run |

## Gate 5 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the receipt preview | pass |
| Tokens centralised | all in `src/index.css` | none elsewhere | pass |
| Only box-shadow transitions | no layout property animated | pass | pass |
| Receipt preview untouched | `git diff` on `mock_receipt.tsx` | one line: `shadow-2xl shadow-primary/10` became `shadow-xl`, so it uses the new tokens | partial |

## The spec said dark mode would be untouched. It was not.

The sections carry `bg-surface-tint`, and a class applies in both themes. So dark mode
gained the same banding, along with the shadow override it needed anyway.

The result is good - dark now has the same rhythm as light, and its shadows are neutral
rather than invisible violet - but the spec's claim was wrong, and it was wrong because
applying a token to a section was treated as a light-mode change when it is a both-modes
change. Recorded rather than quietly re-scoped.

Dark surfaces were given their own values (`0.20` and `0.24` lightness) rather than
inheriting light's, and all 14 dark pairs were re-measured.

## How depth was achieved, since the headline number did not move

`--card` against `--background` is still 1.047:1. The fix was not to separate them by
fill:

- **Shadows do the lifting.** Brand-tinted, with an inset white hairline at the top edge
  so a card reads as a lit raised surface rather than an outlined rectangle.
- **Bands do the sectioning.** Two tinted bands break the page into parts, at 1.078
  against the background - small as a number, clearly visible as an edge across a full
  page width.
- **Accent panels do the emphasis.** The privacy block and closing CTA sit at 1.114.

Keeping `--background` at the supplied `#F8FAFC` was deliberate. If it still reads flat,
tinting the page itself is the next lever and is the author's call.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`. A tint
that looks right and drops any pair below 4.5:1 is not shipped; the tint gets lighter.
