# Brand Refresh — Implementation Plan

Branch `feature/brand-refresh`, cut from `main`. PR targets `main`, titled with the
branch name. Review runs automatically on open.

| Commit | Covers |
| --- | --- |
| `docs: add brand refresh spec` | the spec |
| `feat: adopt the paper plane brand palette` | task 2 |
| `feat: set the wordmark in the brand typeface` | task 3 |
| `chore: replace the app icons with the paper plane mark` | tasks 1, 4 |
| `docs: record brand refresh validation` | task 5 |

Palette and icons are separate commits: one is a token change touching every surface,
the other is a pile of binaries. Together they make an unreadable diff.

## Task 1 — Extract the assets

The sheet is a presentation, so each variant is cropped out of it.

1. **Find the real bounds by measurement, not by eye.** Scan for pixels that are not
   background and take the extremes. The last brand shipped twice with defects from a
   crop box that was eight pixels off, and both were invisible against white.
2. Crop the purple app icon, and the bare favicon mark separately.
3. Mask the squircle corners transparent, **inset far enough to clear the edge**. The
   previous mark needed an 8 px inset at a 362 px working size to clear its own glossy
   rim; this one is flat, so it may need less, but the inset is chosen by sampling the
   edge rather than reused.
4. Resize to 512, 256, 192, 180, 96, 48, 32, 16, and build the `.ico`.

**Verify at each size:** corner pixels transparent, no near-white pixel on the outer
ring, and no two icons byte-identical.

## Task 2 — The palette

Replace every token in `src/index.css` with values derived from the six supplied
colours, converted to oklch so the file stays in one colour space.

Light mode maps directly. Dark mode is derived: keep the hue, invert lightness, lift the
primary so it stays legible on a dark surface, and keep chroma restrained in dark where
saturated colour reads as noisy.

**Re-measure every pair.** None of the existing contrast numbers survive — every token
changes, including the hue of the neutrals.

Also update `.brand-gradient` and `.brand-glow`, which still hold the old violet stops.
The new sheet shows a flat mark; a gradient tuned to the old one will not match it.

## Task 3 — The wordmark

`npm install @fontsource/poppins` and import the 700 weight only, so one file is added
rather than a family.

Register it in `src/index.css` as a second theme font - the display face - leaving
`--font-sans` as Geist for everything else. Nothing but the wordmark uses it.

`LogoWordmark` renders the word with a **dotless `ı`** (U+0131) and an absolutely
positioned violet dot above it. The accessible name must still read "Receipta": a
dotless i is a different character, so the visible text needs an `aria-label`, or the
real word in a visually hidden span, or the dot applied as a decorative overlay on a
normal `i`. Pick whichever keeps the text selectable and correct when copied.

**Verify:** render it beside the sheet's wordmark at the same size and compare. Check
the accessible name is "Receipta" and that copying the text yields "Receipta", not
"Receıpta".

## Task 4 — Swap the icons and the logo component

Replace the files in place, so nothing that references them needs changing. `logo.tsx`
already renders `logo_mark.png` at a caller-controlled size and needs no edit beyond its
comment, which describes the old mark.

Update `index.html`'s `theme-color` and `site.webmanifest`'s `theme_color` and
`background_color`, which still carry the old values.

## Task 5 — Verify and record

Rasterise the favicon at 16 and 32 and **look at both**. Render the mark on light and on
dark and look at both. Run the contrast script. Walk the home page in both themes.

## Risks

**The source is a JPEG.** Edges carry ringing that a PNG would not. At 32 px and above it
should be invisible; at 16 px it may not be. If the result is poor, the fix is to ask for
a better source, not to sharpen a lossy image.

**The bare-plane favicon is a thin diagonal.** It has less mass than a filled squircle,
so it may read as faint against both light and dark tabs. The alternative is to use the
filled app icon as the favicon instead, which is a deviation from the sheet and should be
raised rather than taken silently.

**Every surface changes at once.** A palette swap touches the whole interface, so a
mistake is everywhere rather than in one place. The contrast table is the check that
catches it; it is not optional and its numbers are not carried over.

**The dotless-i trick breaks copy and paste if done carelessly.** Someone copying the
logo text must get "Receipta", not "Receıpta". Whichever approach is taken, that is
checked rather than assumed.

**The neutrals change hue.** Going from purple-tinted to slate is subtle per-element and
obvious in aggregate. Worth looking at the whole page rather than one component.
