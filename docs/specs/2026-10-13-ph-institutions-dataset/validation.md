# Philippine Financial Institutions Dataset — Validation

## Gate 0 — Commands

| Check | Command | Expected | Result |
| --- | --- | --- | --- |
| Build | `npm run build` | exit 0 | — |
| Lint | `npm run lint` | exit 0 | — |
| Tests | `npm test` | exit 0 | — |

## Gate 1 — Schema

| ID | Check | Expected | Result |
| --- | --- | --- | --- |
| D1 | parses | the file is valid JSON | — |
| D2 | required fields | every entry has id, name, category, institutionType, icon | — |
| D3 | unique ids | no duplicates | — |
| D4 | id format | lowercase, hyphenated, no spaces | — |
| D5 | category union | every value is ewallet, digital_bank, or local_bank | — |
| D6 | names non-empty | and free of legal suffixes like Inc. | — |
| D7 | updated date | present and matching the authoring date | — |
| D8 | typed accessor | consumers import the `.ts`, never the raw `.json` | — |

## Gate 2 — Icons, and the privacy claim

The requirement most easily broken by a convenient shortcut, so it is checked directly.

| ID | Check | Command | Expected | Result |
| --- | --- | --- | --- | --- |
| I1 | no third-party icon URLs | `grep -n "http" institutions.json` | no matches | — |
| I2 | all icons local | every `icon` starts `/institutions/` | — | — |
| I3 | every icon exists | each referenced file is on disk | — | — |
| I4 | no orphan files | no image without a dataset entry | — | — |
| I5 | no placeholder globes | no two icons are byte-identical | — | — |
| I6 | no empty files | every icon is above a minimum size | — | — |
| I7 | total weight | the icon directory is under 1 MB | — | — |
| I8 | privacy claim still true | the built output contacts no external origin | — | — |

## Gate 3 — Content accuracy

| Check | Expected | Result |
| --- | --- | --- |
| Digital banks complete | every BSP-licensed digital bank present | — |
| Major e-wallets present | the ones in real use | — |
| Major banks present | the universal and commercial banks people are paid into | — |
| No defunct entries | nothing merged, closed, or delicensed | — |
| No rural or cooperative banks | out of scope by decision | — |
| Entry count | between 40 and 60 | — |
| Every entry sourced | traceable to BSP or the institution's own site | — |
| No InstaPay or PESONet claims | the schema carries none | — |

## Gate 4 — Rule compliance

| Check | Expected | Result |
| --- | --- | --- |
| snake_case files | `institutions.json`, `institutions.ts` | — |
| No `any` | the accessor is fully typed | — |
| Type alias not interface | per project convention | — |
| `payment_modes` untouched | the home page strip still works | — |

## Uncertainties to record

Anything that could not be confirmed goes here rather than being resolved by guessing:

- institutions whose classification was ambiguous
- names that differ between BSP's listing and the institution's own site
- icons that came back poor or generic

## Sign-off

Not ready until every Result cell holds a measurement or an explicit `not run`. For this
dataset specifically, an unverifiable entry is removed rather than shipped with a note.
