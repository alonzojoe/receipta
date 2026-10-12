# Legal Pages — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — Automated tests

| ID | Test | Asserts | Result |
| --- | --- | --- | --- |
| G1 | routes render | `/privacy`, `/terms`, `/cookies` each render | — |
| G2 | single h1 | each page has exactly one `h1` | — |
| G3 | heading order | no level is skipped on any page | — |
| G4 | header and footer | both appear on each page | — |
| G5 | no placeholder links | no `href="#"` anywhere in the footer | — |
| G6 | footer links | all three legal routes are linked | — |
| G7 | last-updated shown | each page renders the shared date | — |
| G8 | one date source | the date comes from config, not a literal in a page | — |
| G9 | storage inventory | the cookie page lists every key in the inventory | — |
| G10 | theme key present | the inventory contains the real theme storage key | — |
| G11 | BIR disclaimer | the terms page states it is not an official receipt | — |
| G12 | no cookies claim | the cookie page states no cookies are set | — |
| G13 | existing suite | every earlier test still passes | — |

## Gate 2 — Claims match the product

Each row is a claim the documents make. The check is whether the codebase agrees.

| Claim | How checked | Expected | Result |
| --- | --- | --- | --- |
| No cookies | `grep -rn "document.cookie" src/ index.html` | no matches | — |
| One storage key | `grep -rn "localStorage\|useLocalStorage" src/ index.html` | only the theme key | — |
| No session storage or IndexedDB | grep | no matches | — |
| No analytics | grep for common vendors | no matches | — |
| No third-party requests | inspect `index.html` and the built output | no external origins | — |
| Fonts self-hosted | check the build output | font files emitted locally | — |

## Gate 3 — Content

| Check | Expected | Result |
| --- | --- | --- |
| No lorem ipsum | every page is real prose | — |
| No invented entity | no company name, address or registration number | — |
| No compliance claim | no assertion of conformance with a named regulation | — |
| Plain language | no unexplained legalese | — |
| Contact route | points at the project's GitHub | — |

## Gate 4 — Responsive and theme

| Width | No h-scroll | Readable measure | Result |
| --- | --- | --- | --- |
| 320 px | | | — |
| 375 px | | | — |
| 768 px | | | — |
| 1024 px | | | — |

| Check | Expected | Result |
| --- | --- | --- |
| Light | legible | — |
| Dark | legible | — |

## Gate 5 — Rule compliance

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| No arbitrary sizes | `grep -rnE '\b(w\|h\|size)-\[' src/` | only icons | — |
| Colour literals | `grep -rn --include='*.tsx' -E '#[0-9a-fA-F]{3,8}' src/` | none | — |
| snake_case files | inspect | all | — |

## Known limitations

- **Not lawyer-reviewed.** The documents describe the application accurately in plain
  language. They are not a substitute for legal review before commercial use.
- **They describe the app on the date written.** The first feature that stores anything
  new makes the Privacy and Cookie pages inaccurate until updated.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`.
