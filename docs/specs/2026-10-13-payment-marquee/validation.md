# Payment Marquee — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — Tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| M1 | renders every institution | all 31 names present once in the accessible tree | — |
| M2 | duplicate hidden | the second track is `aria-hidden` | — |
| M3 | logos decorative | images are `aria-hidden` with empty `alt` | — |
| M4 | reduced motion | no animation applied; content still rendered | — |
| M5 | nothing focusable | no focusable element inside the track | — |
| M6 | config removed | `payment_modes` and `PaymentMode` gone from `src/` | — |
| M7 | existing suite | every earlier test still passes | — |

## Gate 2 — The loop

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Seam invisible | shorten the duration so several loops pass, then watch | no jump at the restart | — |
| Constant speed | compare with a different item count | unchanged pixels per second | — |
| One direction | observe | no reversing | — |
| Hover pauses | hover on a pointer device | stops, resumes on leave | — |
| Touch unaffected | no stuck pause state | — | — |

## Gate 3 — Motion rules

| Check | Expected | Result |
| --- | --- | --- |
| Animated property | `transform` only | — |
| Timing | `linear` | — |
| Reduced motion | no movement at all, content still shown | — |
| No `transition: all` | none | — |

## Gate 4 — Responsive and theme

| Width | No h-scroll | Strip readable | Result |
| --- | --- | --- | --- |
| 320 px | | | — |
| 375 px | | | — |
| 768 px | | | — |
| 1024 px | | | — |

| Check | Expected | Result |
| --- | --- | --- |
| Light | logos legible against the surface | — |
| Dark | logos legible; dark-on-dark marks still visible | — |
| Edge fade | items enter and leave rather than being cut | — |

## Gate 5 — Weight

| Check | Expected | Result |
| --- | --- | --- |
| Images above the fold | 31 logos do not delay first paint | — |
| Total icon weight | unchanged at ~456 KB | — |

## Gate 6 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | — |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | none | — |
| Keyframes in index.css | not inline in a component | — | — |

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
