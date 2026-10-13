# Payment Marquee — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 96 tests, 14 files |

## Gate 1 — Tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| M1 | renders every institution | all 31 names present once in the accessible tree | pass - measured live: 31 in the real copy, 31 in the duplicate |
| M2 | duplicate hidden | the second track is `aria-hidden` | pass |
| M3 | logos decorative | images are `aria-hidden` with empty `alt` | pass - all 62 |
| M4 | reduced motion | no animation applied; content still rendered | pass - the hook is mocked, see note |
| M5 | nothing focusable | no focusable element inside the track | pass - zero, measured live |
| M6 | config removed | `payment_modes` and `PaymentMode` gone from `src/` | pass - zero references |
| M7 | existing suite | every earlier test still passes | pass - one updated, see below |

## Gate 2 — The loop

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Seam invisible | measured the geometry instead of watching | **found an 8px jump, fixed, now 0px** - see below |
| Constant speed | duration derived from item count | pass - 31 x 2.6s = 80.6s, confirmed in computed style |
| One direction | observe | pass |
| Hover pauses | hover on a pointer device | not run - the class is applied and gated behind `@media (hover:hover)`, but hover was not exercised |
| Touch unaffected | no stuck pause state | not run | not run |

## Gate 3 — Motion rules

| Check | Expected | Result |
| --- | --- | --- |
| Animated property | `transform` only | pass - the keyframes animate nothing else |
| Timing | `linear` | pass - confirmed in computed style |
| Reduced motion | no movement at all, content still shown | pass in test; not exercised in a real browser |
| No `transition: all` | none | pass |

## Gate 4 — Responsive and theme

| Width | No h-scroll | Strip readable | Result |
| --- | --- | --- | --- |
| 320 px | | | not run |
| 375 px | | | not run |
| 768 px | | | not run |
| 1024 px | | | not run |

| Check | Expected | Result |
| --- | --- | --- |
| Light | logos legible against the surface | not run |
| Dark | logos legible; dark-on-dark marks still visible | pass - rendered and inspected |
| Edge fade | items enter and leave rather than being cut | pass |

## Gate 5 — Weight

| Check | Expected | Result |
| --- | --- | --- |
| Images above the fold | 31 logos do not delay first paint | pass - `loading="lazy"` on every logo; no horizontal scroll and the page rendered normally |
| Total icon weight | unchanged at ~456 KB | pass - no new images added |

## Gate 6 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | pass |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | none | pass |
| Keyframes in index.css | not inline in a component | pass | pass |

## The seam bug, found and fixed

The spec named this as the thing most likely to be wrong, and it was.

The track used a flex `gap` between the two copies. That gap sits **between** them, so
`translateX(-50%)` never accounts for it: the strip travelled 6611px when it needed to
travel 6619px, landing **8px short** and jumping by that much once per loop.

It was not found by watching. At 80 seconds a loop, the jump happens roughly once a
minute and lasts one frame. It was found by measuring the geometry directly - comparing
half the track width against the actual distance between the two copies' left edges.

Fixed by removing the gap between copies and giving each copy its own trailing padding,
so the two tile exactly. Re-measured: **seam error 0px**.

Worth keeping: a marquee seam is a geometry problem, so measure it rather than watch for
it.

## Reduced motion is tested against a mock

`motion/react` reads the reduced-motion media query when its module loads, before a test
can stub `matchMedia`, so stubbing the query does not reach it. The marquee tests mock
the hook instead. That verifies the component branches correctly on the answer, which is
the part this component owns; it does not verify that the library reports the preference
correctly. The same gap was recorded in the theme work.

## Test updated

The home page's "names every payment mode" test asserted the four hardcoded labels,
including "Bank Transfer", which is not an institution and no longer exists. Replaced
with an assertion against real dataset entries.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
