# Light Mode Refresh — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — The problem is actually fixed

Measured, since "looks better" is not a result.

| Check | Before | Target | After | Result |
| --- | --- | --- | --- | --- |
| Card vs background separation | 1.047:1 | visibly layered | — | — |
| Shadows carry the brand hue | neutral black | violet-tinted | — | — |
| Tinted band present | none | at least one | — | — |
| Accent panels present | none | privacy and closing CTA | — | — |

## Gate 2 — Contrast, full cross product

Every foreground against every surface it can land on. New surfaces included.

| Foreground | Surface | Minimum | Measured | Result |
| --- | --- | --- | --- | --- |
| `--foreground` | `--background` | 4.5:1 | — | — |
| `--foreground` | `--card` | 4.5:1 | — | — |
| `--foreground` | `--muted` | 4.5:1 | — | — |
| `--foreground` | `--surface-tint` | 4.5:1 | — | — |
| `--foreground` | `--surface-accent` | 4.5:1 | — | — |
| `--muted-foreground` | `--background` | 4.5:1 | — | — |
| `--muted-foreground` | `--card` | 4.5:1 | — | — |
| `--muted-foreground` | `--muted` | 4.5:1 | — | — |
| `--muted-foreground` | `--surface-tint` | 4.5:1 | — | — |
| `--muted-foreground` | `--surface-accent` | 4.5:1 | — | — |
| `--primary-foreground` | `--primary` | 4.5:1 | — | — |
| `--secondary-foreground` | `--secondary` | 4.5:1 | — | — |

## Gate 3 — Dark mode is unchanged

The claim most likely to be quietly wrong, because shadow tokens are shared.

| Check | Expected | Result |
| --- | --- | --- |
| Dark home page, before vs after | visually identical apart from shadows | — |
| Dark shadows readable | not violet-on-dark, which is invisible | — |
| Dark contrast pairs | unchanged from the brand refresh numbers | — |

## Gate 4 — Visual

| Check | Expected | Result |
| --- | --- | --- |
| Whole page, light | reads as layered bands, not one sheet | — |
| Whole page, light, before/after | the difference is obvious | — |
| Cards at rest | lifted, not outlined | — |
| Card hover | shadow deepens, no layout shift | — |
| Mock receipt | reads as a physical object | — |
| Header scrolled | shadow present | — |
| Not muddy | the aggregate is still clean | — |
| Legal pages | inherit the treatment without looking odd | — |

## Gate 5 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the receipt preview | — |
| Tokens centralised | all in `src/index.css` | none elsewhere | — |
| Only box-shadow transitions | no layout property animated | — | — |
| Receipt preview untouched | `git diff` on `mock_receipt.tsx` | no change | — |

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`. A tint
that looks right and drops any pair below 4.5:1 is not shipped; the tint gets lighter.
