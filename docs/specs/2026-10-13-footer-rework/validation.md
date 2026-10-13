# Footer Rework — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 78 tests, 12 files |

## Gate 1 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| F1 | no "Built by" | the string appears nowhere in the footer | pass - asserted in test and confirmed at every measured width |
| F2 | repository label | the external link's visible text is the product name | pass |
| F3 | repository target | it points at the repository, not the profile | pass - asserted against the config value, plus a check that it ends in `/receipta` |
| F4 | external link safety | `target="_blank"` and `rel` contains `noopener` and `noreferrer` | pass |
| F5 | legal links present | all three render with their routes | pass - scoped to the nav, so a stray match elsewhere cannot satisfy it |
| F6 | legal links route | they are router links, not full page loads | pass |
| F7 | separators hidden | each separator is `aria-hidden` | pass - all three |
| F8 | nav is named | the legal links sit in a `nav` with an accessible name | pass |
| F9 | no "Legal" heading | the stacked column's heading is gone | pass - zero `h2` in the footer |
| F10 | one URL definition | the repository URL is defined once in config | pass - one literal in `src/`; `legal_contact_url` now re-exports it |
| F11 | existing suite | every earlier test still passes | pass - two needed updating, see below |

## Gate 2 — Layout

| Width | No h-scroll | Legal links in a row | Separators correct | Result |
| --- | --- | --- | --- | --- |
| 320 px | yes | wraps, no separators | pass |
| 375 px | yes | one line, no separators | pass |
| 768 px | yes | one line, separators shown | pass |
| 1024 px | yes | one line, separators shown | pass |

Checked in a reflowing iframe, comparing `scrollWidth` against `clientWidth` and
looking for any element whose right edge exceeds the viewport.

| Check | Expected | Result |
| --- | --- | --- |
| Bottom bar is one row at `sm`+ | repository link left, legal row right | pass |
| Bottom bar stacks below `sm` | no overflow, links wrap | pass - zero overflowing elements in the footer at every width measured |
| No dangling separator when wrapped | separators dropped at narrow widths | pass, after a fix - see below |
| Upper block not visibly lopsided | acceptable with the legal column removed | pass - the logo and description read as a left-aligned block rather than an orphaned column |

## Gate 3 — Theme

| Check | Expected | Result |
| --- | --- | --- |
| Light | legible, links distinguishable | pass - rendered and inspected |
| Dark | legible, links distinguishable | pass - rendered and inspected |
| Footer follows the theme | still not pinned dark | pass - asserted in test and confirmed in both themes |

## Gate 4 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | pass - zero |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | none | pass - zero |
| No `transition-all` | `grep -rn "transition-all" src/` | none | pass |
| No `ease-in` | `grep -rnE 'ease-in\b' src/` | none outside comments | pass |
| Duplicate repo URL | `grep -rn "github.com/alonzojoe" src/` | one definition | pass - exactly one |

## The dangling separator, found and fixed

The plan called this out as a risk and it was real. The legal separators were hidden
below `sm` from the start, but the one between the repository link and the copyright
was not. At 320px that line wraps, and the measurement showed the dot sitting alone at
the end of the first line:

```
Receipta ·
(c) 2026 Receipta. All rights reserved.
```

Caught by comparing the separator's vertical position against the element after it,
rather than by looking at a screenshot - at that size the dot is small enough to miss.
Fixed by applying the same `hidden sm:inline` the legal separators already had.
Re-measured at 320, 375, 768 and 1440: no separator is ever last on its line.

## Tests this work changed

Two existing tests asserted the old shape and were corrected, not deleted:

- `site_footer.test.tsx` asserted the external link pointed at the personal profile.
  It now asserts the repository.
- The home page test of the same name asserted the profile URL and the author's name as
  the accessible name. Both changed with the label.

The home page heading-order test was unaffected, as predicted: it is scoped to `<main>`,
so the footer losing its `Legal` heading does not reach it. Confirmed by running it, not
assumed.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
