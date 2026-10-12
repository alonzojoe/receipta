# Legal Pages — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 74 tests, 12 files |

## Gate 1 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| G1 | routes render | `/privacy`, `/terms`, `/cookies` each render | pass |
| G2 | single h1 | each page has exactly one `h1` | pass |
| G3 | heading order | no level is skipped on any page | pass |
| G4 | header and footer | both appear on each page | pass |
| G5 | no placeholder links | no `href="#"` anywhere in the footer | pass - asserted on the home page and all three legal pages |
| G6 | footer links | all three legal routes are linked | pass |
| G7 | last-updated shown | each page renders the shared date | pass |
| G8 | one date source | the date comes from config, not a literal in a page | pass - the test reads the constant, so a hardcoded date would fail it |
| G9 | storage inventory | the cookie page lists every key in the inventory | pass - row count asserted equal to the inventory length |
| G10 | theme key present | the inventory contains the real theme storage key | pass - compared against the exported constant, not a string copy |
| G11 | BIR disclaimer | the terms page states it is not an official receipt | pass |
| G12 | no cookies claim | the cookie page states no cookies are set | pass |
| G13 | existing suite | every earlier test still passes | pass - four tests needed updating, see below |

## Gate 2 — Claims match the product

Each row is a claim the documents make. The check is whether the codebase agrees.

| Claim | How checked | Expected | Result |
| --- | --- | --- | --- |
| No cookies | `grep -rn "document.cookie" src/ index.html` | no matches | pass - zero |
| One storage key | `grep -rn "localStorage\|useLocalStorage" src/ index.html` | only the theme key | pass - three hits, all the theme key: the hook, its import, and the no-flash script |
| No session storage or IndexedDB | grep | no matches | pass |
| No analytics | grep for common vendors | pass - the only hits are the legal pages' own prose saying there are none |
| No third-party requests | inspect `index.html` and the built output | pass - one `tailwindcss.com` string appears in the built CSS; checked and it is inert text, not an `@import` or `url()`, so no request is made |
| Fonts self-hosted | check the build output | font files emitted locally | pass - 5 woff2 files emitted into the bundle |

## Gate 3 — Content

| Check | Expected | Result |
| --- | --- | --- |
| No lorem ipsum | every page is real prose | pass |
| No invented entity | no company name, address or registration number | pass |
| No compliance claim | no assertion of conformance with a named regulation | pass - the Data Privacy Act is described as context, with no claim of conformance |
| Plain language | no unexplained legalese | pass |
| Contact route | points at the project's GitHub | pass |

## Gate 4 — Responsive and theme

| Width | No h-scroll | Readable measure | Result |
| --- | --- | --- | --- |
| 320 px | yes | 16px gutter, one h1 | pass |
| 375 px | not run | | not run |
| 768 px | yes | 24px gutter, one h1 | pass |
| 1024 px | not run | | not run |

Measured in a reflowing iframe across all three pages: no horizontal scroll and zero
overflowing elements at either width.

| Check | Expected | Result |
| --- | --- | --- |
| Light | legible | not run |
| Dark | legible | pass - the privacy page was rendered and read in dark mode |

## Gate 5 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | pass - zero |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | none | pass - zero |
| snake_case files | inspect | all | pass |

## Not verified

- **Light mode was not viewed.** The session ran dark throughout.
- **375px and 1024px** were not measured; 320 and 768 were.

## An alignment bug this surfaced

Opening the pages showed the body text starting 24px to the left of the logo above it.
The cause was not the legal pages: `Section` applied its gutter *outside* the
`max-w-5xl` container while the header applied its gutter *inside*, so the two
disagreed by exactly one gutter width. Every page had it, including the home page; it
was simply easier to see on a page that opens with a heading.

Fixed by moving the padding inside the container in `Section`. Measured after: the logo
and the first heading both sit at x=242 on `/privacy` and on `/`, an offset of 0 where
it was 24px. Full-bleed section backgrounds still span the viewport, checked on the
features section, and the gutters still hold at 16px on a 320px screen.

## Tests this work broke, and why

Four existing tests failed and were corrected rather than deleted:

- Two **footer** tests failed because the footer now navigates with router `Link`s and
  needs a router around it. They now render inside a memory router.
- The home page's **heading-order** test failed because the footer gained a "Legal"
  heading. The scan is now scoped to `<main>`, since the footer is not part of a page's
  section order.
- The home page's **placeholder** test asserted `href="#"` on Privacy and Terms. That
  assertion was the thing this work removes, so it was replaced with one asserting the
  real routes, plus a new test that no `href="#"` survives anywhere.

## Known limitations

- **Not lawyer-reviewed.** The documents describe the application accurately in plain
  language. They are not a substitute for legal review before commercial use.
- **They describe the app on the date written.** The first feature that stores anything
  new makes the Privacy and Cookie pages inaccurate until updated.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
