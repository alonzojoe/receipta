# Footer Rework — Implementation Plan

Branch `feature/footer-rework`, cut from `main`. PR targets `main` and is titled with
the branch name.

| Commit | Covers |
| --- | --- |
| `docs: add footer rework spec` | the spec |
| `refactor: move legal links into the footer bar` | tasks 1-3 |
| `docs: record footer rework validation` | task 4 |

Small enough to be one implementation commit. Splitting a single component's layout
change across several would make the history harder to read, not easier.

## Task 1 — Point the repository link at the repository

`site.author.github_url` currently holds a profile URL and is used for the "Built by"
credit. The footer now links the product, so it needs the repository.

`shared/config/legal.ts` already exports `legal_contact_url` with exactly that URL.
Rather than add a second constant holding the same string, move the repository URL into
`shared/config/site.ts` as `site.repository_url` and have `legal.ts` re-use it. One URL,
one definition.

Leave `site.author.name` in place. It is no longer rendered, but removing it is a
separate decision and nothing else depends on it being gone.

**Verify:** `grep` finds exactly one literal of the repository URL in `src/`.

## Task 2 — Rework the footer markup

Upper block: unchanged apart from losing the legal column. It becomes a single column
holding the logo and the description.

Bottom bar becomes the one row described in the requirements:

- Left: the GitHub mark with the label `Receipta`, linking to the repository, plus the
  copyright line beneath it
- Right: a `nav` containing the three legal links in a row

Separators are rendered as `aria-hidden` spans between the links rather than as
`::before` content, so they can be hidden from assistive technology and dropped at
narrow widths with a responsive class. A CSS-generated separator cannot be hidden from
a screen reader as reliably.

The repository link's accessible name must state the destination. The visible text is
`Receipta`; the accessible name should read as the project repository on GitHub.

**Verify:** the row is a row at `sm` and above, and wraps rather than overflowing below
it.

## Task 3 — Update the tests that assert the old shape

Two existing tests touch this and will fail, correctly:

- `site_footer.test.tsx` asserts the external link's `href` equals the profile URL. That
  assertion becomes the repository URL.
- The home page's heading-order test is already scoped to `<main>`, so removing the
  footer's `Legal` heading does not affect it. Confirm rather than assume.

Add tests for the new shape:

- no "Built by" text anywhere in the footer
- the repository link's visible text is the product name
- the repository link points at the repository, opens in a new tab, and carries
  `noopener noreferrer`
- all three legal links are present and still point at their routes
- the separators are `aria-hidden`
- the legal links sit inside a `nav` with an accessible name

**Verify:** `npm test` exits 0, and the new tests fail if reverted. A test that passes
against the old markup is not testing the change.

## Task 4 — Verify and record

Render the footer at 320, 375, 768 and 1024 and check for overflow and for the row
wrapping cleanly. Look at it in both themes. Fill in `validation.md` with results, using
`not run` where something was not checked.

## Risks

**The upper block becomes lopsided.** Removing the legal column leaves the logo and
description alone on the left with empty space to their right. That may look unbalanced
and is worth a visual check; if it does, the fix is to tighten the upper block rather
than to invent content for the right side.

**Wrapped separators.** At narrow widths a dot left dangling at the end of a wrapped
line reads as a typo. The responsive class dropping them has to be checked at a real
width, not assumed.
