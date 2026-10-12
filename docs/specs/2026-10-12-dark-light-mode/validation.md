# Dark and Light Mode — Validation

Commands, tests, or something rendered and looked at. `not run` is a valid result.

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| T1 | default is system | with nothing stored, the resolved theme matches the media query | — |
| T2 | stored choice wins | a stored `dark` resolves dark even when the device prefers light | — |
| T3 | light applies | choosing Light removes the `dark` class from `<html>` | — |
| T4 | dark applies | choosing Dark adds the `dark` class | — |
| T5 | system tracks | a media-query change updates the resolved theme without a reload | — |
| T6 | unsubscribes | the media-query listener is removed on unmount | — |
| T7 | persistence | the choice is written to `localStorage` under the expected key | — |
| T8 | storage failure | a throwing `localStorage` falls back to system, no crash | — |
| T9 | trigger name | the button has an accessible name describing what it does | — |
| T10 | menu options | all three render, each with a label | — |
| T11 | tick follows selection | the active option is marked | — |
| T12 | trigger icon | the icon matches the active choice | — |
| T13 | footer follows theme | the footer no longer carries a forced `dark` class | — |
| T14 | storage key matches | the literal in `index.html` equals the exported constant | — |
| T15 | existing suite | every earlier test still passes | — |

## Gate 2 — No flash

The reason the inline script exists, so it is checked rather than assumed.

| Check | How | Expected | Result |
| --- | --- | --- | --- |
| Class set before paint | read `<html>` class at `DOMContentLoaded` | already correct | — |
| Dark user, cold load | stored dark, hard reload | no white flash | — |
| Light user, cold load | stored light, dark OS, hard reload | no dark flash | — |
| Script is blocking | inspect `index.html` | inline, no `defer`, before the module | — |

## Gate 3 — Behaviour in a browser

| Check | Expected | Result |
| --- | --- | --- |
| Fresh visitor | gets the device theme | — |
| Choose Light | applies immediately | — |
| Choose Dark | applies immediately | — |
| Reload after choosing | choice survives | — |
| System follows live OS change | page updates with no reload | — |
| Keyboard | open, arrow, select, Escape all work | — |
| Focus return | focus goes back to the trigger on close | — |

## Gate 4 — Visual

| Check | Expected | Result |
| --- | --- | --- |
| Light, full page | reads correctly | — |
| Dark, full page | reads correctly, every section | — |
| Footer, light | light, matching the page | — |
| Footer, dark | dark, matching the page | — |
| Mock receipt, dark | still white paper | — |
| Logo, both themes | unchanged, correct on both surfaces | — |
| Header scrolled, dark | border and blur still read | — |

## Gate 5 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No `cn` package | `grep -rn 'from "cn"' src/` | none | — |
| `cn` not a dependency | inspect `package.json` | absent | — |
| snake_case files | inspect `src/` | all, including the generated dropdown | — |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | — |
| No `transition-all` | `grep -rn "transition-all" src/` | none | — |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | only the mock receipt | — |
| No new colours | inspect `index.css` | no tokens added | — |

## Gate 6 — Responsive

| Width | No h-scroll | Switcher visible | Result |
| --- | --- | --- | --- |
| 320 px | | | — |
| 375 px | | | — |
| 768 px | | | — |
| 1024 px | | | — |

## Known limitations

- `prefers-color-scheme` cannot be genuinely changed from jsdom, so T1 and T5 run
  against a stubbed media query. The live OS-change path needs a browser check.
- The storage key is duplicated between `index.html` and the config. T14 guards the
  drift; removing the duplication would need a build step.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
