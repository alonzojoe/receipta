# Brand Refresh — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 103 tests |

## Gate 1 — Assets

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Crop bounds measured | scan for non-background pixels | bounds found by measurement, not by eye | pass - app icon detected at x 247-450, y 424-626 |
| Corners transparent | sample all four corners of each PNG | alpha 0 | pass |
| No white fringe | scan inward from each edge for the first opaque pixel | brand colour, never near-white | pass - purple on all four edges |
| No duplicates | hash every icon | all distinct | pass - 7 files, 7 distinct |
| Sizes correct | `magick identify` | 512, 256, 192, 180, 96, 48, 32, 16 | pass |
| `.ico` built | `magick identify` | contains 48, 32, 16 | pass |
| Old mark gone | inspect every asset | no receipt-squircle anywhere | pass - all regenerated from the plane |

## Gate 2 — The 16px test

Failed twice before on this project, so it is checked by rendering, not by reasoning.

| Size | Expected | Result |
| --- | --- | --- |
| 16 px, light tab | the plane is identifiable | pass - with the FILLED icon, see below |
| 16 px, dark tab | still identifiable, no halo | pass - with the filled icon; the bare plane failed this |
| 32 px | clean, no JPEG ringing visible | pass |
| 180 px | full detail | pass |

## Gate 3 — Contrast, fully re-measured

Every token changes, so no number carries over from the previous palette.

| Pair | Mode | Minimum | Measured | Result |
| --- | --- | --- | --- | --- |
| `--foreground` on `--background` | light | 4.5:1 | 14.03:1 | pass |
| `--foreground` on `--background` | dark | 4.5:1 | 17.54:1 | pass |
| `--primary-foreground` on `--primary` | light | 4.5:1 | 5.79:1 | pass |
| `--primary-foreground` on `--primary` | dark | 4.5:1 | 6.83:1 | pass |
| `--muted-foreground` on `--background` | light | 4.5:1 | 4.55:1 | pass - see the Muted note |
| `--muted-foreground` on `--background` | dark | 4.5:1 | 7.72:1 | pass |
| `--foreground` on `--card` | light | 4.5:1 | 14.68:1 | pass |
| `--foreground` on `--card` | dark | 4.5:1 | 16.14:1 | pass |

## Gate 4 — Palette fidelity

| Check | Expected | Result |
| --- | --- | --- |
| All six supplied colours present | as tokens | pass - with one documented departure |
| Primary matches | `#6C3AED` | pass - `oklch(0.526 0.247 287)` |
| Neutrals are slate | not purple-tinted | pass - hue 248-257 |
| Dark mode marked as derived | documented, not presented as supplied | pass - stated in the file comment |
| Gradients updated | no old violet stops left | pass - zero references to the old hexes |
| `theme-color` updated | `index.html` and the manifest | pass - both now `#6c3aed` |

## Gate 5 — Visual

| Check | Expected | Result |
| --- | --- | --- |
| Home page, light | reads correctly end to end | pass - rendered and inspected |
| Home page, dark | reads correctly end to end | pass - rendered and inspected |
| Nav logo, light | correct | pass |
| Nav logo, dark | correct | pass |
| Marquee pills | still legible against the new surface | pass |
| Receipt preview | unchanged, still its own document colours | pass |
| Buttons | primary still reads as the brand | pass |

## Gate 6 — The wordmark

| Check | Expected | Result |
| --- | --- | --- |
| Typeface | n/a - the wordmark is cut from the sheet, not set in a typeface | n/a |
| Visual match | it IS the sheet's wordmark | pass |
| Violet dot | present on the `i`, sized like the sheet | pass |
| Accessible name | reads "Receipta" | pass - visually hidden text; both images are decorative |
| Copied text | yields "Receipta" | pass - it is real text, not a dotless-i trick |
| Light mode | near-black, matching the sheet | pass |
| Dark mode | near-white, matching the sheet | pass |
| Only the wordmark uses it | the interface stays in Geist | pass - no font added |
| Added weight | two PNGs, ~120 KB total | pass - no font added |

## Gate 7 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the receipt preview | pass |
| Tokens centralised | all in `src/index.css` | none elsewhere | pass |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | pass |

## Three departures from the sheet

**The favicon uses the filled app icon, not the bare plane.** The sheet designates the
bare plane as the favicon. Rendered at 16px it is thin on a light tab and nearly
disappears on a dark one - its violet has almost no contrast against a dark surface. The
source is also only 115px, too small to upscale cleanly. The filled squircle has mass and
reads on both. **The author's call to overturn.**

**Muted text is `#64748B`, not `#CBD5E1`.** The sheet gives `#CBD5E1` for "descriptions,
borders". It measures **1.42:1** on the background - correct for a border, unreadable as
text. So `#CBD5E1` is the border token, and muted text uses `#64748B` from the sibling
brand sheet: same designer, same slate family, 4.55:1.

**The wordmark is cut from the sheet, not set in a typeface.** The first approach was
Poppins 700, which matched well. The author asked for the sheet's own wordmark instead,
so both light and dark versions are extracted as images. It is the exact artwork rather
than a near match, at the cost of being raster.

## A defect caught before shipping

The first wordmark extraction included **the top three pixel rows of the tagline**,
visible as a faint smudge under the word. Found by counting opaque pixels per row and
spotting a gap between the `p` descender (row 114) and a separate element (rows 125-127).
Re-cropped above the tagline; both assets now scan as a single element with no gaps.

## Open questions

- Is a PNG or SVG of the mark available? The JPEG is lossy and a vector would be better
  for every size, especially 16 px.
- If the bare-plane favicon reads faint at 16 px, is substituting the filled app icon
  acceptable? That deviates from the sheet and is the author's call, not ours.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
