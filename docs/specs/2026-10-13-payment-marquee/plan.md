# Payment Marquee — Implementation Plan

Branch `feature/payment-marquee`, cut from `main`. PR targets `main`, titled with the
branch name. Review, replies, resolved threads, then the author merges.

| Commit | Covers |
| --- | --- |
| `docs: add payment marquee spec` | the spec |
| `feat: show the institutions as a scrolling marquee` | tasks 1-3 |
| `refactor: drop the hardcoded payment modes` | task 4 |
| `docs: record payment marquee validation` | task 5 |

## Task 1 — The keyframes

In `src/index.css`, beside the existing brand gradients, because the project keeps
colour and motion primitives there rather than scattered through components.

```css
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

`-50%` is the whole trick: the track holds the list twice, so translating by half its
width lands exactly on the start of the second copy, and the reset is invisible.

Only `transform` animates. `linear` timing, because constant motion with an eased curve
visibly speeds up and slows down on every loop.

## Task 2 — The marquee primitive

`src/shared/ui/marquee.tsx` — generic, takes children, so a second use later does not
copy this.

- Outer element clips, and carries the edge mask
- Inner track holds the children twice; the second copy is `aria-hidden`
- Duration passed as a CSS custom property derived from the item count, so speed stays
  constant as the list grows
- `animation-play-state: paused` on hover, gated behind `@media (hover: hover)`
- Under reduced motion the animation is not applied at all and the track wraps instead

Reduced motion is read with `useReducedMotion` from `motion/react`, already a dependency
and already used by `Reveal`, rather than hand-rolling a second media query listener.

**Verify:** a test asserting the duplicate track is `aria-hidden`, and one asserting no
animation class under reduced motion.

## Task 3 — The widget

`home_payment_modes` renders `institutions` from the dataset through the marquee. Each
item is its logo and its name. Images are `aria-hidden` with empty `alt`, sized small —
icons are the one place fixed dimensions are allowed.

The stale comment about no logo being invented comes out; it has been false since the
dataset landed.

## Task 4 — Remove the dead config

Delete `payment_modes` and its `PaymentMode` type from `site.ts`. Check for references
first — the home page test asserts the four labels and will need updating to assert
against the dataset instead.

**Verify:** `grep -rn "payment_modes\|PaymentMode" src/` returns nothing.

## Task 5 — Verify and record

Run it. Watch a full loop and check the seam. Measure responsive widths in a reflowing
iframe. Check both themes. Toggle reduced motion and confirm the strip is static.

## Risks

**The seam is the thing most likely to be wrong**, and it is only visible once per loop.
Watching for two seconds proves nothing. The check is to shorten the duration
temporarily so several loops pass quickly, then watch for a jump.

**Thirty-one logos is 31 images above the fold.** They total 456 KB, which is not alarming,
but it is worth confirming they do not delay first paint. If they do, the fix is lazy
loading on the duplicate track, not dropping institutions.

**Mixed logo shapes.** These are favicons from thirty-one different organisations: some
square, some circular, some padded, some not. The strip may look visually ragged in a
way no individual icon does. If so the fix is a consistent box per item, not editing the
marks.
