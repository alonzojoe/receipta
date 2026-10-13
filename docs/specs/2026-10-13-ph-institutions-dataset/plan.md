# Philippine Financial Institutions Dataset — Implementation Plan

Branch `feature/ph-institutions-dataset`, cut from `main`. PR targets `main`, titled
with the branch name.

| Commit | Covers |
| --- | --- |
| `docs: add ph institutions dataset spec` | the spec |
| `feat: add philippine financial institutions dataset` | tasks 1-3 |
| `chore: add institution icons` | task 4 |
| `docs: record institutions dataset validation` | task 5 |

Icons are a separate commit because it is a few dozen binary files and mixing them with
the data makes the data diff unreadable.

## Task 1 — Research

The output is a source-backed list, not a recollection. Work in this order:

1. **BSP directories** for the authoritative lists: universal and commercial banks,
   digital banks, and licensed electronic money issuers. BSP is the regulator and is the
   only source that settles who exists and how they are classified.
2. **Each institution's own site** to confirm the current trading name and the domain
   the icon will come from.
3. Record the domain for each entry in the fetch script, not in the dataset.

Rules while researching:

- If a name cannot be confirmed, the entry does not ship.
- Watch for recent mergers and rebrands. A bank that merged is one entry, not two.
- Digital banks are the category most likely to have changed; check the licence list
  rather than assuming the ones that were licensed first are still the full set.
- Note anything uncertain in the validation document rather than quietly resolving it.

## Task 2 — The dataset

Write `src/shared/config/institutions.json` in the documented shape. Order within each
category is alphabetical, so a reviewer can diff it and a reader can find an entry.

Generating `id` from the name mechanically (lowercase, non-alphanumerics to hyphens)
keeps them predictable, but check the results by hand: `bpi` is better than
`bank-of-the-philippine-islands`, and the short form is what people recognise.

## Task 3 — Typed access

`src/shared/config/institutions.ts` exports the `Institution` type, the parsed list, and
small helpers: lookup by id, and grouping by category for a picker.

Consumers import from the `.ts`, never the `.json`, so the shape is checked once at the
boundary rather than trusted everywhere.

Add a test asserting the JSON satisfies the type at runtime: unique ids, non-empty
names, category within the union, icon path under `/institutions/`. A type annotation
alone does not validate the contents of a JSON file.

## Task 4 — Icons, fetched once and stored

A script, not a runtime call. It reads a domain map, fetches each favicon at 128px,
writes it to `public/institutions/<id>.png`, and reports anything that failed.

The script is committed under `scripts/` so the work is repeatable when an institution
rebrands, but it is **run manually, not on build**. A build that reaches out to the
network is a build that breaks offline and in CI.

Checks after running it:

- Every entry in the dataset has a corresponding file
- No file is a zero-byte or placeholder image. A favicon service returns a generic globe
  for a domain it does not know, and shipping fifty identical globes is worse than
  shipping none.
- Total size is reasonable. Fifty 128px PNGs should be well under a megabyte; if it is
  not, they need compressing.

**On trademarks:** these are brand marks shown to identify a payment method the user
actually used, which is the same nominative basis as the existing payment strip. We do
not restyle them, imply endorsement, or use them as decoration.

## Task 5 — Verify and record

Work through `validation.md`. Specifically confirm no icon URL points off-site, since
that is the requirement most likely to be quietly violated by a convenient shortcut.

## Risks

**This data goes stale.** Banks merge, digital banks get licensed, wallets close. The
`updated` field makes that visible rather than silent. It will need revisiting, and the
spec should not pretend otherwise.

**Favicons are not brand assets.** They are small, inconsistent in padding and shape,
and some are poor. The result will look less tidy than hand-sourced logos. That is the
accepted trade-off for not inventing marks and not calling a third party; a later pass
can replace individual icons with official assets.

**Scope creep toward a complete BSP list.** Hundreds of rural banks exist. The test is
whether this audience gets paid through it, not whether it holds a licence.

**The research is the hard part, not the code.** The code here is trivial; the value is
entirely in the list being correct. Time goes into verification.
