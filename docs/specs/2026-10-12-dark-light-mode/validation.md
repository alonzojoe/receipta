# Dark and Light Mode — Validation

Commands, tests, or something rendered and looked at. `not run` is a valid result.

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 53 tests, 11 files |

## Gate 1 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| T1 | default is system | with nothing stored, the resolved theme matches the media query | pass - also confirmed live: a fresh load with storage cleared rendered dark on a dark-preferring device and wrote nothing to storage |
| T2 | stored choice wins | a stored `dark` resolves dark even when the device prefers light | pass - and live, a stored `light` stayed light on a dark-preferring device |
| T3 | light applies | choosing Light removes the `dark` class from `<html>` | pass |
| T4 | dark applies | choosing Dark adds the `dark` class | pass |
| T5 | system tracks | a media-query change updates the resolved theme without a reload | pass against a stubbed media query |
| T6 | unsubscribes | the media-query listener is removed on unmount | pass |
| T7 | persistence | the choice is written to `localStorage` under the expected key | pass |
| T8 | storage failure | a throwing `localStorage` falls back to system, no crash | pass - `getItem` stubbed to throw |
| T9 | trigger name | the button has an accessible name describing what it does | pass - reads "Theme: <choice>. Change theme" |
| T10 | menu options | all three render, each with a label | pass |
| T11 | tick follows selection | the active option is marked | pass - `aria-current` plus a check icon, so it is not colour alone |
| T12 | trigger icon | the icon matches the active choice | pass |
| T13 | footer follows theme | the footer no longer carries a forced `dark` class | pass |
| T14 | storage key matches | the literal in `index.html` equals the exported constant | pass - read through Vite's `?raw`, so the app tsconfig needs no Node types |
| T15 | existing suite | every earlier test still passes | pass |

## Gate 2 — No flash

The reason the inline script exists, so it is checked rather than assumed.

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Class set before paint | read `<html>` class at `DOMContentLoaded` | not run - see Not verified |
| Dark user, cold load | stored dark, hard reload | partial - the final state is correct; the absence of a flash was not captured frame by frame |
| Light user, cold load | stored light, dark OS, hard reload | partial - verified the page settles light on a dark-preferring device; the intermediate frames were not captured |
| Script is blocking | inspect `index.html` | inline, no `defer`, before the module | pass - asserted by test, the key appears before `/src/main.tsx` |

## Gate 3 — Behaviour in a browser

| Check | Expected | Result |
| --- | --- | --- |
| Fresh visitor | gets the device theme | pass - measured live |
| Choose Light | applies immediately | pass |
| Choose Dark | applies immediately | pass |
| Reload after choosing | choice survives | pass - measured live in a fresh document |
| System follows live OS change | page updates with no reload | not run - the OS theme was not toggled during the session; covered only by the stubbed-media test |
| Keyboard | open, arrow, select, Escape all work | not run - relies on shadcn's dropdown-menu, which was not restyled in ways that would break it |
| Focus return | focus goes back to the trigger on close | not run |

## Gate 4 — Visual

| Check | Expected | Result |
| --- | --- | --- |
| Light, full page | reads correctly | not run - the session rendered dark throughout |
| Dark, full page | reads correctly, every section | pass - hero, payment pills, cards and nav inspected |
| Footer, light | light, matching the page | not run |
| Footer, dark | dark, matching the page | pass |
| Mock receipt, dark | follows the theme, by author's decision | pass |
| Logo, both themes | unchanged, correct on both surfaces | pass - and a light fringe on the icon's top and right edges was found and fixed, see below |
| Header scrolled, dark | border and blur still read | pass |

## Gate 5 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No `cn` package | `grep -rn 'from "cn"' src/` | none | pass |
| `cn` not a dependency | inspect `package.json` | absent | pass - the CLI re-added it and it was removed again |
| snake_case files | inspect `src/` | all, including the generated dropdown | pass - renamed to `dropdown_menu.tsx` |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | pass |
| No `transition-all` | `grep -rn "transition-all" src/` | none | pass |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the mock receipt | pass - now zero, since the mock receipt moved onto theme tokens |
| No new colours | inspect `index.css` | no tokens added | pass |

## Gate 6 — Responsive

| Width | No h-scroll | Switcher visible | Result |
| --- | --- | --- | --- |
| 320 px | | | not run |
| 375 px | | | not run |
| 768 px | | | not run |
| 1024 px | | | not run |

The header markup changed only by adding one icon button inside the existing flex row,
so the responsive probe was not re-run. That is an assumption, not a measurement, and
is listed here as such.

## Not verified

- **No flash was not captured frame by frame.** The final state is correct in both
  directions, and the script is proven to sit before the app module, but the
  intermediate frames were not recorded. A polling probe returned the blank document
  before the script ran, which measures the probe rather than the page.
- **A real OS theme change** was not performed. The System path is covered only by the
  stubbed media query.
- **Keyboard operation and focus return** were not exercised. They come from shadcn's
  dropdown-menu, which was not restyled in ways that typically break them.
- **Light mode was not viewed.** The session ran dark throughout; light is covered by
  the measured contrast table and the token swap, not by looking at it.
- **The responsive probe was not re-run** after adding the switcher.

## A bug this work surfaced

The app icon carried a **light fringe along its top and right edges**, invisible on a
white page and obvious on a dark one. The cause was the original crop box: measured
against the artwork, the squircle sits at `x 882-1242, y 241-607` in the source sheet,
and the first crop was taken 8px too far right and 9px too high, so it baked in the
sheet's lavender background. Sampling proved it - `256,6` was fully opaque near-white.

Re-cropped centred on the detected bounds. That removed the offset, but a second,
separate problem remained: the source artwork carries its own pale glossy rim along the
squircle's edge, part of its glass styling. Against white it is invisible; against a
dark surface it reads as a white outline tracing the icon.

Fixed by insetting the mask 8px at the 362px working size, so the clip falls inside that
rim rather than on it. Verified by scanning inward from all four edges: the first fully
opaque pixel is saturated violet on every side - rgb(112,59,251) left, rgb(98,52,253)
right, rgb(141,89,253) top, rgb(61,25,214) bottom - and all four corners are fully
transparent.

Two lessons worth keeping. An offset crop and a baked-in rim look identical from a
distance and needed different fixes. And both were invisible on the light page the work
was being checked against, which is why the icon was signed off twice before the author
caught it on a dark background.

## Known limitations

- `prefers-color-scheme` cannot be genuinely changed from jsdom, so T1 and T5 run
  against a stubbed media query. The live OS-change path needs a browser check.
- The storage key is duplicated between `index.html` and the config. T14 guards the
  drift; removing the duplication would need a build step.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
