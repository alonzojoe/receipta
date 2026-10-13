# Brand Refresh — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — Assets

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Crop bounds measured | scan for non-background pixels | bounds found by measurement, not by eye | — |
| Corners transparent | sample all four corners of each PNG | alpha 0 | — |
| No white fringe | scan inward from each edge for the first opaque pixel | brand colour, never near-white | — |
| No duplicates | hash every icon | all distinct | — |
| Sizes correct | `magick identify` | 512, 256, 192, 180, 96, 48, 32, 16 | — |
| `.ico` built | `magick identify` | contains 48, 32, 16 | — |
| Old mark gone | inspect every asset | no receipt-squircle anywhere | — |

## Gate 2 — The 16px test

Failed twice before on this project, so it is checked by rendering, not by reasoning.

| Size | Expected | Result |
| --- | --- | --- |
| 16 px, light tab | the plane is identifiable | — |
| 16 px, dark tab | still identifiable, no halo | — |
| 32 px | clean, no JPEG ringing visible | — |
| 180 px | full detail | — |

## Gate 3 — Contrast, fully re-measured

Every token changes, so no number carries over from the previous palette.

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

## Gate 4 — Palette fidelity

| Check | Expected | Result |
| --- | --- | --- |
| All six supplied colours present | as tokens | — |
| Primary matches | `#6C3AED` | — |
| Neutrals are slate | not purple-tinted | — |
| Dark mode marked as derived | documented, not presented as supplied | — |
| Gradients updated | no old violet stops left | — |
| `theme-color` updated | `index.html` and the manifest | — |

## Gate 5 — Visual

| Check | Expected | Result |
| --- | --- | --- |
| Home page, light | reads correctly end to end | — |
| Home page, dark | reads correctly end to end | — |
| Nav logo, light | correct | — |
| Nav logo, dark | correct | — |
| Marquee pills | still legible against the new surface | — |
| Receipt preview | unchanged, still its own document colours | — |
| Buttons | primary still reads as the brand | — |

## Gate 6 — The wordmark

| Check | Expected | Result |
| --- | --- | --- |
| Typeface | Poppins 700, self-hosted | — |
| Visual match | compared side by side against the sheet | — |
| Violet dot | present on the `i`, sized like the sheet | — |
| Accessible name | reads "Receipta" | — |
| Copied text | yields "Receipta", not "Receıpta" | — |
| Light mode | near-black, matching the sheet | — |
| Dark mode | near-white, matching the sheet | — |
| Only the wordmark uses it | the interface stays in Geist | — |
| Added weight | one weight only, measured in the build output | — |

## Gate 7 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the receipt preview | — |
| Tokens centralised | all in `src/index.css` | none elsewhere | — |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | — |

## Open questions

- Is a PNG or SVG of the mark available? The JPEG is lossy and a vector would be better
  for every size, especially 16 px.
- If the bare-plane favicon reads faint at 16 px, is substituting the filled app icon
  acceptable? That deviates from the sheet and is the author's call, not ours.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
