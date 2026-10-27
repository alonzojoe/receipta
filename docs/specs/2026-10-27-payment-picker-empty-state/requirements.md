# Payment picker: suggest the fallbacks when a search finds nothing

## Goal

The author:

> "payment method modifications — upon searching, when no results found, suggest the
> others so that the user will know that he can choose Other instead of showing nothing"

## What is wrong today

The picker's empty state reads *"No match. Choose Other to type your own."* — and at that
moment **Other is not on screen.** cmdk filters the whole list against the query, so a
search for `paypal` removes every institution *and* removes Cash and Other along with
them. The message names a way out that the user cannot take without first clearing what
they typed.

So the advice is correct and unreachable, which is worse than no advice: it tells someone
their option exists and then hides it.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| How the fallbacks survive a search | **`forceMount` on the Something else group and its items** | cmdk filters by its own match; `forceMount` keeps a node rendered regardless. The alternative, matching every query with hidden keywords, would make Cash and Other appear to *match* `paypal`, which is a lie the list would be telling. |
| Are they always visible, or only when nothing matches? | **Always** | They are two rows. Hiding them while a search narrows the banks means they reappear at the moment of failure, which reads as the UI reacting to a mistake. Always present is calmer and makes the group's heading honest. |
| The empty message | Names what was searched, and points at what is on screen | *"No bank or wallet matches 'paypal'."* The instruction to pick Other is no longer needed in words, because Other is visible directly below. |
| Choosing Other after a failed search | **Carries the typed text into the Other field, but only when that field is empty** | Someone who typed `paypal` and picks Other should not type `paypal` again. The empty-field condition came out of review: a search is a weaker signal than a value entered deliberately, and overwriting one loses work that cannot be recovered. |
| Order inside Something else | **Other first, then Cash** | cmdk highlights the first rendered item and Enter takes it. When a search matches no institution those two are all that remain - and with Cash first, someone who typed a bank's name and pressed Enter silently recorded a CASH payment. Found in review. |
| What the typed text does not do | It never becomes the method id, and it is trimmed and capped by the existing Other rule | The picker chooses `other`; the text is a separate field with its own validation, unchanged. |

## Scope

In scope: `payment_method_picker.tsx`, the Payment step that supplies its props, and their
tests.

Out of scope: the institution dataset, the search algorithm itself, the icons, and the
Other field's own rules — the text it receives passes through the same validation as text
typed by hand.

## Acceptance criteria

1. With an empty search, the list shows the institution groups and a Something else group
   containing Cash and Other (specify).
2. With a search that matches no institution, **Cash and Other (specify) are still
   rendered and still selectable**, by mouse and by keyboard.
3. With a search that matches some institutions, those institutions are shown, and Cash
   and Other are still present.
4. The empty message names the text that was searched, and does not instruct the user to
   find an option that is off screen.
5. Choosing Other after typing a query sets the method to `other` **and** puts the typed
   text into the Other field.
6. Choosing Other leaves an Other value the user already typed alone, whether the query is
   empty or not. It fills that field only when it is empty.
6a. Pressing Enter after a search that matches nothing chooses **Other**, not Cash.
7. Choosing Cash, or any institution, never writes to the Other field.
8. The typed text reaches the Other field as the user typed it; trimming and the length
   limit are the existing rule's job, and a query longer than that limit produces the
   existing error rather than being silently cut.
9. Keyboard operation is unchanged: arrow keys move through what is rendered, Enter
   chooses, Escape closes, and focus returns to the trigger.
10. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

No browser is available on this project, so everything is verified through the rendered
DOM in jsdom with user-event. The one thing that cannot be checked here is how the list
*looks* when a search fails — whether the Something else group reads as a sensible
fallback rather than as leftovers. That is for the author on screen.

## Deferred

- Suggesting a close match for a typo (`gcsh` → GCash). It needs a fuzzy matcher and a
  judgement about when a suggestion is confident enough to show, and neither is worth it
  before anyone has used this.
- Remembering the last method used.
