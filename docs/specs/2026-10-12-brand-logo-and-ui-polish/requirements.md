# Brand Logo and UI Polish — Requirements

## Goal

Replace the placeholder logo with the real Receipta brand artwork, align the theme to
the brand's colour, and raise the overall finish of the home page.

The logo that shipped yesterday was drawn from a text description. A designed brand
sheet now exists, so the drawn mark is retired.

## Source asset

`receipta-logo-.png`, 1536x1024, a presentation sheet rather than a usable asset. It
contains three variants on a light lavender background:

| Variant | Contents |
| --- | --- |
| Landscape | squircle mark plus the "Receipta" wordmark, on a white pill |
| Portrait | the squircle app icon |
| Favicon | the same squircle, smaller |

Nothing in it is transparent and nothing is a separate file, so every asset has to be
cropped out and masked.

### The mark

A violet gradient squircle holding a white receipt: a curled top edge, a torn zigzag
bottom, three violet rules, a circular check badge at the lower right, and a
four-pointed sparkle at the upper right.

### Sampled brand colour

Measured from the artwork, not guessed.

| Sample | Hex | oklch |
| --- | --- | --- |
| Gradient, top left | `#CF6FFD` | `oklch(0.708 0.215 313.4)` |
| Gradient, bottom left | `#502BE4` | `oklch(0.478 0.253 280.1)` |
| Gradient, mid | `#784EFE` | `oklch(0.576 0.245 286.9)` |
| Check badge | `#521AF6` | `oklch(0.486 0.281 279.5)` |
| Receipt rules | `#9367FD` | `oklch(0.634 0.213 292.8)` |
| Paper | `#FCFBFE` | near white |

The brand's core violet sits at **hue 287**. The theme currently runs at **hue 293**,
six degrees away, which is close enough to look accidental rather than intentional.

## Scope

### In scope

- Extract the mark from the sheet as reusable, corner-masked assets
- Replace the drawn SVG mark everywhere it appears: nav, footer, favicon
- Add the icon sizes a real site needs, plus a web manifest
- Shift the theme hue from 293 to 287 so the interface and the logo share a colour
- Raise the finish of the home page: spacing rhythm, card treatment, header behaviour,
  typographic detail

### Out of scope

- The receipt builder. Still Phase 1, `/create` stays a placeholder.
- Privacy and Terms pages. Still `#`.
- Payment provider logos. Still text, still waiting on official brand assets.
- A dark/light toggle. Tokens exist, the control is still later.
- Redrawing the wordmark. It stays live text.

## Asset requirements

**The artwork does not survive 16px.** Rasterised and inspected: at 32px the receipt,
rules, badge and sparkle all read; at 16px it collapses into a white smudge on violet.
So the favicon cannot simply be the artwork scaled down.

Two tiers, by size:

| Asset | Source | Why |
| --- | --- | --- |
| `public/favicon.svg` | redrawn, simplified | Must read at 16px. Brand gradient, receipt, badge; sparkle and the third rule dropped as sub-pixel detail. |
| `public/apple-touch-icon.png` (180) | real artwork | Home-screen icon, large enough for the full detail. |
| `public/icon-192.png`, `public/icon-512.png` | real artwork | PWA and manifest. |
| `src/shared/assets/logo_mark.png` (256) | real artwork | Nav and footer, served at 2x for a ~32px slot. |

Every raster asset has transparent corners, masked to the squircle, so it never shows a
light rectangle against a dark surface.

`index.html` references the SVG favicon, the apple touch icon, and the manifest. The
manifest carries the name, both icon sizes, the brand theme colour, and a background
colour.

## Logo component

`src/shared/ui/logo.tsx` keeps its three exports — `LogoMark`, `LogoWordmark`, `Logo` —
so no consumer changes. `LogoMark` renders the artwork instead of inline SVG paths.

- The mark is decorative beside the wordmark, so it stays `aria-hidden`
- Sized by the caller, with intrinsic `width`/`height` set to avoid layout shift
- `loading="eager"` and `decoding="async"`: it is above the fold in the header

It no longer inherits `currentColor`. That is deliberate — the brand mark has a fixed
gradient and must look the same in both themes, the same way the mock receipt does.

## Theme

Shift every token's hue from 293 to 287. Lightness and chroma are unchanged, so the
existing contrast results carry over in structure but must be **re-measured**, not
assumed.

Contrast requirement is unchanged: 4.5:1 for body text and interactive labels.

## UI polish

Concrete changes only; no open-ended restyling.

1. **Header** — gains a scrolled state. It starts transparent over the hero and takes
   on its border and blur once the page scrolls, so the hero reads as one surface.
2. **Hero** — the decorative wash picks up the brand's two-stop gradient rather than a
   flat tint of primary.
3. **Cards** — steps and features get a consistent treatment: a soft shadow at rest, a
   slightly stronger one plus a brand-tinted border on hover. Icon tiles pick up the
   brand gradient instead of a flat accent fill.
4. **Payment strip** — currently four bare words. Gets separated pills so it reads as a
   deliberate band rather than leftover text.
5. **Typography** — display headings get tighter tracking; body copy gets a slightly
   looser measure for readability.
6. **Section rhythm** — one spacing scale across sections, so the gaps stop varying.

Motion rules are unchanged and still binding: named transition properties, `ease-out`
or the custom curve, nothing over 300ms except the scroll reveal, `transform` and
`opacity` only, hover gated, reduced motion drops movement.

## Acceptance criteria

1. No drawn placeholder mark remains anywhere in `src/` or `public/`
2. The nav, the footer, and the browser tab all show the real brand mark
3. The favicon is legible at 16px, verified by rasterising and looking at it
4. `apple-touch-icon`, both PWA icons, and a valid manifest exist and are referenced
5. Every raster icon has transparent corners
6. Every theme token sits at hue 287, with contrast re-measured and still at or above
   4.5:1
7. All six UI polish items are implemented
8. No horizontal scroll at 320, 375, 768, 1024
9. Light and dark both legible; the mark looks correct on both
10. Reduced motion still drops all movement
11. `npm run build`, `npm run lint`, `npm test` all exit 0
