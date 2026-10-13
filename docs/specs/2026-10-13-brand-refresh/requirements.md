# Brand Refresh — Requirements

## Goal

Replace the receipt-in-a-squircle mark with the new paper-plane brand, and adopt the
palette that comes with it.

## The new brand

Source: `reveipta new brand.jpeg`, 1536x1024.

**The mark** is a paper plane whose tail is a torn receipt — the fold lines of the plane
double as the rules on a receipt, and the trailing edge is the familiar zigzag. It reads
as *sending* rather than *recording*, which is closer to what Receipta is for: the
product's whole claim is that you send the thing.

**Three variants are supplied:**

| Variant | Size | Description |
| --- | --- | --- |
| App icon | 1024 | Purple squircle, white plane |
| App icon, light alternative | 1024 | Very pale lavender squircle, purple plane |
| Favicon / link icon | 512 | The bare plane, no background |

**The palette is specified**, which it was not last time:

| Token | Hex | Stated use |
| --- | --- | --- |
| Primary | `#6C3AED` | |
| Primary Light | `#A78BFA` | |
| Secondary | `#EDE9FE` | |
| Text | `#1F2937` | |
| Muted | `#CBD5E1` | |
| Background | `#F8FAFC` | |

## Decisions this forces

### The neutrals change character

`#6C3AED` is `oklch(0.526 0.247 287.3)` — hue **287.3**, which is where our theme already
sits. The primary is effectively unchanged.

The neutrals are not. `#1F2937`, `#CBD5E1` and `#F8FAFC` are **slate** — blue-grey, hue
around 250. The current palette deliberately tints every neutral with the brand hue, on
the stated principle that the purple should read as the material of the interface rather
than an accent stuck onto grey.

Adopting the palette literally abandons that principle. **Take the palette as given**:
it is a designed decision, slate neutrals against a violet primary is a deliberate and
common pairing, and overriding a supplied palette to preserve our own earlier reasoning
would be the tail wagging the dog. The principle gets rewritten, not quietly kept.

### Dark mode is not specified

The sheet gives light-mode values only. Dark values are derived, keeping the supplied
hues and inverting lightness, the same method used for the current palette. Every pair
is re-measured for contrast; none of the current measurements carry over, because every
token changes.

### The wordmark comes from the other sheet

The mark is the paper plane from `reveipta new brand.jpeg`. The **wordmark** is taken
from `Receipta Brand Identity Showcase.png`, which specifies it for both light and dark
mode. Author's decision: plane mark, showcase wordmark.

It stays **live text**, not a cropped image: it is then crisp at any size, selectable,
and it themes with one definition instead of two files. But it cannot stay in Geist.

The wordmark is a heavy geometric sans with a **single-story `a`**, round `e` and `c`,
a straight-legged `R`, and an angled cut on the `t`. Geist has a double-story `a` and is
not geometric, so it is not a near miss - it is a different kind of letterform.

**Poppins 700** matches it. Rendered side by side against the sheet: the `a`, `R`, `e`
and `t` all correspond, and 700 carries the same weight as the sheet where 800 is
noticeably heavier. Self-hosted through `@fontsource/poppins`, so no third-party request
and no change to the Privacy Policy's claim.

Two typefaces is a deliberate exception to the one-family rule, scoped to the wordmark
only. A display face for the logo and a text face for the interface is a normal split,
and the alternative - a cropped image per theme - is worse on every axis that matters.

**The dot on the `i` is violet and oversized**, and it is the detail that makes the
wordmark recognisable. Built by setting the word with a dotless `ı` and positioning a
violet dot above it, so it stays live text.

Colours come from the sheet and match the tokens already: near-black in light
(`#232433`, close to the supplied Text `#1F2937`), near-white in dark. The existing
`text-foreground` already resolves to both, so the wordmark needs no theme-specific
colour of its own.

## Source quality

The file is a **JPEG**, 79 KB for 1536x1024 — heavily compressed. The flat background
measures 254,254,254 with a standard deviation of 0.52, so the large areas are clean, but
JPEG ringing will sit along every edge of the mark.

That is workable for raster icons at the sizes we need, and it is worse than the PNG we
had last time. **If a PNG or SVG of the mark exists, it should be used instead**, and
this requirement should be revisited rather than quietly accepted.

## Assets to produce

Replacing the current set, all cropped from the sheet and corner-masked:

- `public/icon-512.png`, `icon-192.png` — the purple app icon
- `public/apple-touch-icon.png` (180)
- `public/favicon-{16,32,48,96}.png` and `favicon.ico`
- `src/shared/assets/logo_mark.png` (256) — for nav and footer

**The favicon needs care.** The supplied favicon variant is the bare plane with no
background: a thin diagonal shape. This project has twice shipped an icon that failed at
16 px — once unreadable, once with a white halo on dark. The bare plane may actually fare
better than the old receipt, being one simple shape, but that is a prediction and must be
checked by rasterising at 16 px and looking at it.

A bare mark with no background also behaves differently on a dark browser tab than a
filled squircle does. Both must be checked.

## Scope

### In scope

- Every icon asset and the in-app logo
- The wordmark typeface, and the violet dot on the `i`
- All theme tokens in `src/index.css`, light and dark, re-measured for contrast
- The brand gradient utilities, which currently use the old violet stops
- Anything referencing the old mark's colours

### Out of scope

- The wordmark as a cropped image. It stays live text.
- Matching the showcase's tagline lockup. The tagline is page copy, not part of the logo.
- The receipt template's own styling
- The institution logos
- Any copy change

## Acceptance criteria

1. Every icon asset shows the paper-plane mark; no receipt-squircle remains
2. All six supplied colours appear as theme tokens
3. Dark-mode values are derived and documented as derived, not supplied
4. Every foreground/background pair measures 4.5:1 or better, re-measured
5. The favicon is legible at 16 px, verified by rasterising and looking
6. Every raster icon has transparent corners, verified by sampling
7. The in-app logo renders correctly in both themes, mark and wordmark together
8. The wordmark is set in Poppins with a violet dot on the `i`, as live text
9. No colour literal outside `src/index.css`, except the receipt preview's document colours
10. `npm run build`, `npm run lint`, `npm test` all exit 0
