# Payment Marquee — Requirements

## Goal

Replace the four hardcoded text pills in the payment strip with the real institutions
dataset, shown as a continuously scrolling marquee of brand logos.

## The word for it

A **marquee** — content that scrolls continuously in one direction and loops. Also
called a logo ticker or a logo cloud marquee.

It is not a carousel. A carousel has discrete slides, an active one, and controls to
move between them. A marquee has none of those: nothing is "current", there is nothing
to click, and it never stops at a position. That distinction decides the whole
implementation, because a carousel needs state and a marquee needs none.

## Current state

`home_payment_modes` renders four labels from `payment_modes` in `site.ts`: GCash, Maya,
MariBank, Bank Transfer. "Bank Transfer" is a category pretending to be a brand. Its
code comment still says no logo is invented here, which is now out of date: 31 real
institutions with real logos landed in PR #11.

## What it shows

All **31 institutions** from `institutions.json`, each as its logo plus its name.

Showing all of them is the point. Four pills say "we support a few things"; a strip of
thirty-one moving past says "whatever you use, it is in here", which is the actual
claim. It is also why a marquee is the right form: thirty-one static pills would be a
wall.

Order is the dataset's order — e-wallets, then digital banks, then banks — so the ones
most people recognise appear first.

## Implementation: CSS, not a library

**Recommendation: no dependency.** A marquee is roughly twenty lines of CSS, and the
reasons go beyond size:

1. **CSS animation runs off the main thread.** A JavaScript marquee drives itself with
   `requestAnimationFrame`, which competes with everything else during page load. This
   strip sits near the top of the page, so it animates at exactly the busiest moment.
   The project has already been bitten by this once, with Framer Motion's main-thread
   `y` shorthand.
2. **Constant motion wants `linear`**, which is the one case where the project's
   animation rules call for it explicitly. No easing decision to get wrong.
3. **Reduced motion is one media query**, rather than a library's own opt-out that has
   to be trusted and tested.
4. Nothing to keep updated.

If a library is preferred anyway, `react-fast-marquee` is the common choice. The spec
assumes the CSS approach; switching is a contained change inside one widget.

## Behaviour

- **Seamless loop.** The track is rendered twice and translated by exactly half its
  width, so the restart is invisible. Any other approach visibly jumps.
- **Constant speed regardless of content.** Duration is derived from the number of
  items, not a fixed number, so adding an institution does not speed the strip up.
- **Pause on hover.** Someone who spots their bank should be able to stop and look at
  it. Gated behind `@media (hover: hover)` so it cannot strand a touch device.
- **One direction.** No ping-pong, no reversing.

## Reduced motion

A strip that moves continuously and never stops is the clearest possible case for
honouring `prefers-reduced-motion`. It is not decoration that can be subtly dialled
back; it moves forever.

Under reduced motion the animation does not run at all, and the institutions render as
a **static wrapped grid** instead. The information is identical; only the movement is
gone.

## Accessibility

- The duplicated track is **`aria-hidden`**. Without that, a screen reader reads all 31
  institutions twice.
- The real track is a list, so it is navigable and countable.
- Each logo is decorative beside its visible name, so images are `aria-hidden` with
  empty `alt`. The name carries the meaning.
- Nothing in the strip is focusable: there is nothing to activate, and a focusable item
  inside a moving track is a trap.

## Visual

- Logos at a small fixed size. Icons are the one place the project permits fixed
  dimensions.
- Logos keep their brand colours. Greyscaling them would be tidier and would also throw
  away the recognisability that makes the strip work.
- The strip **fades at both edges** with a mask, so items enter and leave rather than
  being sliced off at a hard boundary.
- The heading stays: "Works with how you already get paid".

## Out of scope

- The payment picker in the receipt builder. This is the marketing strip only.
- Any claim about InstaPay, PESONet, or transfer limits.
- Linking a logo anywhere.

## Cleanup

`payment_modes` in `site.ts` was only ever used by this widget. It goes, along with its
type, in the same change. Leaving a dead config array behind is how a codebase acquires
two sources of truth for the same thing.

## Acceptance criteria

1. The strip renders all 31 institutions from the dataset, with logos
2. `payment_modes` and its type are gone from `site.ts`, with no references left
3. The loop is seamless — no visible jump at the restart
4. Speed does not change when the number of institutions changes
5. The duplicated track is `aria-hidden`; a screen reader encounters each institution once
6. Under reduced motion nothing animates and a static grid is shown instead
7. Hover pauses the strip, on hover-capable devices only
8. Only `transform` is animated
9. No horizontal scroll at 320, 375, 768, 1024
10. Light and dark both legible
11. `npm run build`, `npm run lint`, `npm test` all exit 0
