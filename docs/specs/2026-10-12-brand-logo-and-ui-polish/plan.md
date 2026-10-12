# Brand Logo and UI Polish — Implementation Plan

Branch `feature/logo-and-ui-polish`, cut from `develop` after PR #3 merged. PR title is
the branch name.

Eight tasks. Each ends with `npm run build`, `npm run lint` and `npm test` passing
before the next starts. Commits are grouped, not one per task:

| Commit | Covers |
| --- | --- |
| `feat: replace logo with brand artwork and add app icons` | tasks 1-3 |
| `feat: align theme palette to brand hue` | task 4 |
| `feat: polish home page ui` | tasks 5-7 |
| `docs: record logo and ui polish validation` | task 8 |

## Task 1 — Extract the assets

The source is a presentation sheet, so every asset is cropped out of it.

1. Crop the portrait icon at `366x366+887+232`, found by cropping wide and narrowing
   against the rendered image rather than by guessing.
2. Build a white-on-black rounded-rectangle mask at radius 82 and apply it with
   `-compose CopyOpacity`, so the corners become transparent instead of carrying the
   sheet's lavender background.
3. Resize to 512, 256, 192 and 180.

Output: `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`,
`src/shared/assets/logo_mark.png`.

**Verify:** every output is RGBA, and the corner pixel is transparent. A corner that is
still opaque means the mask silently failed.

## Task 2 — Redraw the favicon for 16px

The artwork does not survive 16px, so the favicon is drawn, not scaled.

Keep: the squircle, the brand's two-stop gradient, the white receipt with its curl and
zigzag, the check badge. Drop: the sparkle, and the third rule. Both are sub-pixel at
16px and only add mud.

**Verify:** rasterise at 16px and 32px and look at both. The receipt silhouette and the
badge must still be distinguishable at 16. This is the check the previous logo failed,
so it is not optional.

## Task 3 — Logo component, metadata, manifest

Rewrite `LogoMark` to render `logo_mark.png` with intrinsic dimensions, `aria-hidden`,
eager loading. `LogoWordmark` and `Logo` keep their signatures so no consumer changes.

Delete the old inline SVG paths. Update `logo.test.tsx`: the assertions about
`currentColor` no longer apply and must be replaced, not deleted silently.

Add to `index.html`: the SVG favicon, `apple-touch-icon`, `theme-color`, and a manifest
link. Write `public/site.webmanifest` with the name, short name, both icons, theme and
background colours, and `display: standalone`.

**Verify:** the manifest parses as JSON and every path it names exists on disk.

## Task 4 — Shift the theme to the brand hue

Replace hue 293 with 287 across every token in `src/index.css`, light and dark.
Lightness and chroma are untouched.

**Verify:** re-run the contrast script over the new values and record the measured
ratios. Structurally the ratios should barely move, but "should" is not a measurement.

## Task 5 — Header scrolled state

The header starts transparent over the hero and gains its border and blur after a small
scroll offset, so the hero reads as a single surface.

A scroll listener is the obvious approach and the wrong one: it fires on every frame.
Use an `IntersectionObserver` on a zero-height sentinel at the top of the page, which
fires twice in total.

Only `background-color`, `border-color` and `backdrop-filter` transition, named
explicitly.

**Verify:** a test asserts the scrolled data attribute flips, and that no scroll
listener is attached.

## Task 6 — Brand gradient surfaces

- Hero wash: the brand's two-stop gradient instead of a flat `primary/8`
- Feature and step icon tiles: the brand gradient, white glyphs
- Cards: soft resting shadow, stronger shadow plus brand-tinted border on hover

Gradients are defined once as utilities or tokens in `src/index.css`, not repeated
inline per component, so the brand has one definition.

## Task 7 — Rhythm, payment strip, typography

- One vertical spacing scale on `Section`, so gaps stop varying between sections
- Payment strip: labels become bordered pills, so the band reads as deliberate
- Display headings get tighter tracking; body copy gets a slightly looser measure

## Task 8 — Verify and record

Work through `validation.md` and fill in every Result cell with a measurement or an
honest "not run". Re-run the responsive probe in a real reflowing viewport, re-check
dark mode, and re-run the compliance greps.

## Risks

**The mark is now a raster.** It is served at 2x for its slot, which covers ordinary
and retina displays, but it will not stay crisp if someone scales it far past its
intended size. If a large-format use appears, that is the point to commission an SVG
rather than to upscale a PNG.

**The sheet is the only source.** There is no layered original, so the cropped PNGs are
effectively the master. Worth keeping the sheet in the repo, or at least knowing it is
the single point of failure for the brand.

**Hue 293 to 287 touches every surface.** It is a one-line-per-token change but it
repaints the whole interface, so contrast is re-measured rather than assumed to carry.
