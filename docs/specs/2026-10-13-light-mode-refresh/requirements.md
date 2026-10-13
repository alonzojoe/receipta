# Light Mode Refresh — Requirements

## Goal

Light mode currently looks flat. Give it depth and brand presence without touching dark
mode and without contradicting the supplied brand palette.

## The diagnosis, measured

The problem is not the colours. It is that the surfaces do not separate:

| Pair | Contrast |
| --- | --- |
| `--card` (`#FFFFFF`) vs `--background` (`#F8FAFC`) | **1.047:1** |
| `--muted` vs `--background` | 1.073:1 |
| `--card` vs `--muted` | 1.123:1 |

A card on the page is 1.047:1 against what it sits on, which is nothing. Every surface
is the same near-white, so the eye reads one undifferentiated sheet. Dark mode does not
have this problem: its surfaces separate properly, which is why only light mode looks
plain.

Three things are missing, and all three are what the reference direction does:

1. **No layering.** Surfaces are all within 1.1:1 of each other.
2. **Neutral shadows.** The defaults are black at low alpha, which reads as grey dirt
   under an element rather than as light falling on it.
3. **No brand presence in the surfaces.** The violet appears on the primary button and
   the hero wash and nowhere else, so the page reads as grey with a purple button on it.

## The approach

Depth comes from **shadow and tint**, not from darkening the page.

The brand sheet supplies `#F8FAFC` as Background and that is kept. The fix is not to
repaint the page but to make what sits on it read as sitting on it:

**1. Brand-tinted shadows.** Shadows carry the brand hue at low alpha instead of neutral
black. A violet-tinted shadow under a card on a cool background reads as light and air;
a black one reads as smudge. This is the single highest-value change and costs nothing
in contrast.

**2. Tinted surface bands.** Sections alternate between the page background and a
surface carrying the brand at roughly 4-8% opacity. Enough to see the band edge, far too
little to affect text contrast.

**3. A raised-surface treatment.** Cards get a shadow and a hairline top highlight, so
they read as lifted rather than as a rectangle with a border. The highlight is a one-
pixel inset white line, which is how a real raised edge catches light.

**4. Accent panels.** Blocks that should draw the eye - the privacy section, the closing
call to action - use a translucent brand tint rather than the same card white as
everything else.

### What is deliberately not done

- **`--background` is not repainted.** `#F8FAFC` is supplied, and changing it would be
  overriding a designed decision to solve a problem that shadow and tint solve better.
  If the result still reads flat, tinting the page is the next lever and is the author's
  call, not ours.
- **Dark mode is untouched.** It does not have this problem.
- **No new hue.** Everything derives from the existing violet and slate.
- **No gradients on text or large surfaces.** The brand sheet calls for flat, and a
  gradient background is a different look, not a deeper one.

## Contrast is not negotiable

Every change here is to a **surface**, and every surface change moves the contrast of the
text on it. The current light-mode numbers are tight in places: `muted-foreground` on
`--muted` sits at 4.90:1, with only 0.4 of headroom.

So: every foreground is re-measured against every surface it can land on, including the
new ones. A tint that looks good and drops text to 4.3:1 is not a trade worth making,
and the tint gets lighter rather than the rule bending.

## Scope

### In scope

- Shadow tokens, brand-tinted, in `src/index.css`
- One or two tinted surface tokens for section bands and accent panels
- Applying them: cards, sections, the header, the hero, the closing call to action
- Re-measuring every affected pair

### Out of scope

- Dark mode
- Layout, spacing, typography, motion
- The receipt preview, which keeps its own document colours
- Any change to the supplied palette's six colours

## Acceptance criteria

1. Card against background reads as layered, not flat
2. Shadows carry the brand hue, not neutral black
3. At least one tinted band breaks the page into sections
4. Every foreground over every surface it can land on measures 4.5:1 or better,
   re-measured and recorded
5. Dark mode is visually unchanged - verified, not assumed
6. No new colour literal outside `src/index.css`
7. The receipt preview is untouched
8. `npm run build`, `npm run lint`, `npm test` all exit 0
