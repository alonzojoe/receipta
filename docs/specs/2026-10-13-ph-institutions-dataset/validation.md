# Philippine Financial Institutions Dataset — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | pass |
| Lint | `npm run lint` | exit 0 | pass |
| Tests | `npm test` | exit 0 | pass - 85 tests, 13 files |

## Gate 1 — Schema

| ID | Check | Expected | Result |
| --- | --- | --- | --- |
| D1 | parses | the file is valid JSON | pass |
| D2 | required fields | every entry has id, name, category, institutionType, icon | pass - asserted per entry |
| D3 | unique ids | no duplicates | pass |
| D4 | id format | lowercase, hyphenated, no spaces | pass |
| D5 | category union | every value is ewallet, digital_bank, or local_bank | pass |
| D6 | names non-empty | and free of legal suffixes like Inc. | pass - asserted with a regex, so `BDO Unibank, Inc.` would fail |
| D7 | updated date | present and matching the authoring date | pass - 2026-10-13 |
| D8 | typed accessor | consumers import the `.ts`, never the raw `.json` | pass - `institutions.ts` is the only importer of the JSON |

## Gate 2 — Icons, and the privacy claim

The requirement most easily broken by a convenient shortcut, so it is checked directly.

| ID | Check | Command | Expected | Result |
| --- | --- | --- | --- | --- |
| I1 | no third-party icon URLs | `grep -n "http" institutions.json` | no matches | pass - zero |
| I2 | all icons local | every `icon` starts `/institutions/` | pass | pass - asserted in test |
| I3 | every icon exists | each referenced file is on disk | pass | pass - enumerated via `import.meta.glob` |
| I4 | no orphan files | no image without a dataset entry | pass | pass - file count equals entry count |
| I5 | no placeholder globes | no two icons are byte-identical | pass | pass - 31 files, 31 distinct images, plus a visual check of all 31 |
| I6 | no empty files | every icon is above a minimum size | pass | pass - the fetcher rejects anything under 200 bytes |
| I7 | total weight | the icon directory is under 1 MB | pass | pass - 456 KB |
| I8 | privacy claim still true | the built output contacts no external origin | pass | pass - see note below |

## Gate 3 — Content accuracy

| Check | Expected | Result |
| --- | --- | --- |
| Digital banks complete | every BSP-licensed digital bank present | pass - all 7, matching BSP's RTGS participant count, asserted by name in a test |
| Major e-wallets present | the ones in real use | pass - GCash, Maya, ShopeePay, GrabPay, Coins.ph |
| Major banks present | the universal and commercial banks people are paid into | pass - 19 of BSP's 44, the rest being foreign branches with no retail presence |
| No defunct entries | nothing merged, closed, or delicensed | pass - taken from BSP lists dated 30 June and 23 September 2026 |
| No rural or cooperative banks | out of scope by decision | pass - BSP lists 132 of them; none included |
| Entry count | the researched answer | 31 - the 40-60 estimate in the spec was wrong and has been corrected there |
| Every entry sourced | traceable to BSP or the institution's own site | pass |
| No InstaPay or PESONet claims | the schema carries none | pass |

## Gate 4 — Rule compliance

| Check | Expected | Result |
| --- | --- | --- |
| snake_case files | `institutions.json`, `institutions.ts` | pass |
| No `any` | the accessor is fully typed | pass |
| Type alias not interface | per project convention | pass |
| `payment_modes` untouched | the home page strip still works | pass - unchanged, home page tests still pass |

## Sources

- **BSP Peso RTGS Payment System Participants**, as of 23 September 2026 - the counts
  and the institution-type breakdown: 44 universal and commercial banks, 7 digital
  banks, 6 non-bank EMIs, 38 thrift, 132 rural and cooperative.
- **BSP list of banks with FCDU/EFCDU authority**, as of 30 June 2026 - the universal
  and commercial bank names as printed.
- Each institution's own site, for the current trading name and its icon.

## On the external-origin check

The built output contains three external strings. None is a request made when the page
loads:

- `github.com` - the footer's `href`. A link is only followed if someone clicks it.
- `react.dev` - inside React's own error message strings.
- `localhost` - development only.

No stylesheet, script, image or font is fetched from another origin. The Privacy
Policy's claim holds.

## Two institutions dropped, and why

**Al-Amanah Islamic Bank** and **Philtrust Bank** are both on BSP's list and both are
real. Neither could be given an icon: both sites return HTTP 403 to automated requests,
and neither icon service has them cached. Rather than ship a broken image or invent a
mark, both were removed and recorded here. Both are marginal for this audience, and
either can be added the moment an icon is obtainable.

That is a deliberate trade-off, not an oversight: the dataset's own test asserts every
entry has a real image, and keeping them would have meant weakening that test.

## What the research changed

The secondary sources were wrong and BSP was right, which is the reason the spec
insisted on the primary source:

- A widely-cited guide claimed **six** digital banks. BSP's participant list says
  **seven**. The seventh is **MariBank**, which converted from a rural bank and received
  its certificate of authority on 8 July 2026.
- MariBank's own domain is `maribank.ph`, not `maribank.com.ph`. Its icon path still
  contains `seabank`, from the Sea Limited lineage.

Worth noting: when MariBank first came up during the home page work, I questioned
whether the intended bank was SeaBank. The author was right and the doubt was based on
out-of-date information.

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`. For this
dataset specifically, an unverifiable entry is removed rather than shipped with a note.
