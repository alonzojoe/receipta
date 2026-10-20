# Discount description

## Goal

The author:

> "for discount we have a revision — put also a discount description, both optional. so
> you will divide the column into 2 for discount description, and if description is filled
> render it also in the pdf, so output is `Discount (student)    -₱100` like that"

A discount can now say what it was for. Both the amount and the description stay optional.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| The field | `discount_description`, free text, **40 characters** | It renders inside the summary's label cell, which is narrow. 40 characters fits `Discount (…)` without the label wrapping under the figure. Notes already exist for anything longer. |
| Where in the form | The Items step, in the same row as the amount: **description left, amount right** | The author's "divide the column into 2". The description is the wider of the two, because an amount is at most 10 characters and a reason is a phrase. |
| A description with no amount | **Blocks Next**, with a message asking for the amount or an empty description | The row only renders when there is a discount above 0, so a description typed without an amount would be silently discarded. Discarding what someone typed is worse than a message. |
| An amount with no description | **Fine, unchanged** | This is the existing behaviour and the common case. |
| How it renders | `Discount (student)` in the label cell, the figure unchanged | The author's example. Parentheses rather than a colon or a dash, because the label is already a noun and the reason qualifies it. |
| Whitespace | Trimmed, inner runs collapsed to single spaces, control characters rejected | The same treatment every other free-text field in this form gets. |
| Draft version | **Unchanged at 1**, with a missing field read as empty | Bumping it would reject every draft already in someone's browser as `wrong_version`, losing their work for a field they never filled. An added optional field does not invalidate the old shape. |

## Scope

In scope: the form's values, field rules, step rules and Items step; the draft schema; the
receipt view model and the summary block; and the tests covering each.

Out of scope: the discount amount's own rules (already specified), percentage discounts
(deferred earlier and still deferred), and multiple discounts.

## Acceptance criteria

1. The Items step shows a discount description field beside the discount amount, in one
   row, description left and amount right.
2. Both fields are optional. A receipt with neither, with only an amount, and with both,
   all pass the step.
3. A description with no amount fails the step with its own message, naming what to do.
   The message appears on Next, not while typing, like every other field in this form.
4. The description is capped at 40 characters, trimmed, with inner whitespace runs
   collapsed and control characters rejected.
5. The document renders `Discount (student)` in the label cell when a description is
   present, and `Discount` when it is not.
6. The discount row still appears only when the discount is above 0. A description alone
   never produces a row.
7. The figure is unchanged by the description: `-₱100.00` either way, to the centavo.
8. The description survives a draft save and restore.
9. **A draft stored before this change still loads**, with the description empty. The
   stored version is not bumped, and a missing field is not `invalid_shape`.
10. The description cannot reach the document unescaped or unbounded: a 40-character
    description renders inside the label cell without pushing the figure out of its
    column.
11. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

No browser is available (author instruction), so criteria 1–9 are verified by tests over
the rendered DOM, the pure rules and the stored draft. **Criterion 10's "without pushing
the figure out"** is a layout claim that jsdom cannot measure: the label cell is sized by
the summary's grid and the figure column is fixed, so a long label wraps rather than
displacing the figure. That is reasoned from the stylesheet, not measured, and is recorded
as such.

## Deferred

- Percentage discounts, still.
- More than one discount line.
- A set of common reasons to pick from instead of free text. Worth considering once there
  is any evidence of what people actually type.
