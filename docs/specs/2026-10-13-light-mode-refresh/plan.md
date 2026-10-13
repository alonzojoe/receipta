# Light Mode Refresh — Implementation Plan

Branch `feature/light-mode-refresh`, cut from `main`. PR targets `main`, titled with the
branch name. Review runs automatically on open.

| Commit | Covers |
| --- | --- |
| `docs: add light mode refresh spec` | the spec |
| `feat: give light mode depth with tinted shadows and surfaces` | tasks 1-3 |
| `docs: record light mode refresh validation` | task 4 |

## Task 1 — Shadow and surface tokens

In `src/index.css`, beside the existing tokens.

**Shadows.** Three levels, all carrying the brand hue rather than black:

```
--shadow-sm   small lift, for a resting card
--shadow-md   the hover step
--shadow-lg   for something genuinely raised
```

Each is the brand violet at low alpha. A second inset white line at the top edge gives
the lit-edge effect that makes a surface read as raised rather than outlined.

Dark mode overrides them to a neutral, higher-alpha shadow: a violet shadow on a dark
surface is invisible, and dark mode's depth comes from its surface separation instead.
That override is the only dark-mode change in this work, and it is a correction rather
than a restyle.

**Surfaces.** Two additions:

```
--surface-tint     a band for alternating sections
--surface-accent   a translucent brand panel for blocks that should draw the eye
```

Both derive from the existing primary, kept light enough that text contrast is unchanged
rather than merely acceptable.

## Task 2 — Apply them

- **Cards** (features, steps, FAQ): resting `--shadow-sm`, hover `--shadow-md`. Only
  `box-shadow` transitions, so nothing reflows.
- **Sections**: alternate page background and `--surface-tint`, so the page reads as
  bands rather than one sheet. Not every other section mechanically; by where the
  content changes subject.
- **The hero's mock receipt**: a stronger lift, since it is the one object meant to look
  like a physical thing.
- **The privacy block and the closing CTA**: `--surface-accent`.
- **The header, when scrolled**: picks up the shadow rather than only a border.

## Task 3 — Re-measure everything

Not a formality. Every surface added is a new background that existing text now sits on.

Extend the contrast script to take the full cross product: each foreground token against
each surface it can appear on, including the two new ones. Record every pair.

If anything lands below 4.5:1, the **tint gets lighter**. The threshold does not move.

## Task 4 — Verify and record

Screenshot light mode before and after, the whole page, and compare. Confirm dark mode
is unchanged by comparing a before and after screenshot of it too - that is the claim
most likely to be quietly wrong, since shadow tokens are shared.

## Risks

**Tint creep.** Each individual addition is defensible and the aggregate can end up
muddy. The check is the whole page at once, not a component at a time.

**Shadows are easy to overdo.** Large soft shadows on everything reads as cheap. Only
things that are genuinely raised get one: cards, the receipt, the scrolled header.

**The dark-mode shadow override is the risky edit.** Shadow tokens are shared, so a
light-mode change reaches dark mode unless it is explicitly overridden. Verified by
comparing screenshots, not by reasoning about the cascade.

**Contrast headroom is already thin.** `muted-foreground` on `--muted` is 4.90:1 today.
Any new surface darker than `--muted` will break it, which is why the measurement is a
task rather than a final check.
