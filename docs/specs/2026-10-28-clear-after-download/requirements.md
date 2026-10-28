# Offer a fresh start after a download

## Goal

The author:

> "after you download a pdf or image a pop up modal will show that do you want to clear
> something"

Someone who has just downloaded their receipt is usually finished with it. The form keeps
everything, so the next receipt starts with the last one's items, amounts and photos still
in place — and the only way to clear them is a button they have to notice at the bottom of
the Review step.

## The shape

```
(✓) Downloaded. Start a new receipt?

Your file is saved and nothing here can change that. Starting a new
receipt clears this form and its photos, and cannot be undone.

            [ Keep this receipt ]   [ Start a new receipt ]
```

The mark sits on the title's line rather than above it: a check in its own block reads as a
status screen, and this is a question. It is a finished-state mark, not a warning one - the
moment this interrupts is a success, and an alert dialog's usual register would otherwise
read as something having gone wrong.

## The copy

```
Start a new receipt?

Your download is saved and nothing here can change that. Starting a new
receipt clears this form and its photos, and cannot be undone.

            [ Keep this receipt ]   [ Start a new receipt ]
```

Three decisions behind that wording:

**It leads with the reassurance, not the warning.** A dialog that says "clear" seconds
after a download reads, for a moment, as though it might delete the file. Saying the
download is safe first removes that before asking anything.

**It names what is actually lost** — the form and the photos — rather than "your data".
The photos are the part someone would be annoyed to re-attach.

**The safe choice is the plain button and the destructive one is marked as such**, matching
the existing Clear draft dialog. Nothing is pre-selected that destroys work.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| When it appears | After a **successful** export only | A failed export leaves the user with nothing; offering to clear their work at that moment is the worst possible timing. |
| After a failure | Never | As above. |
| Downloading both PDF and PNG | Asked **after each**, on the author's instruction: *"show it each time the download image or pdf is press"* | Built first as ask-once-per-draft and changed on sight. Predictable beats clever: the keep action is always one click and always the default, so an unwanted offer costs little, and a rule about when it does and does not appear is a rule nobody can see. |
| The default action | **Keep this receipt** | Escape, the backdrop and the plain button all keep the work. The destructive action takes a deliberate click. |
| Reusing the Clear draft dialog | **Its mechanism, not its copy** | The same `AlertDialog` primitives and the same `clear_draft` path, so there is one way to clear a draft. The words differ because the moment differs: one is "I want to throw this away", the other is "I have finished with this". |

## Acceptance criteria

1. After a successful PDF export, the dialog appears.
2. After a successful PNG export, the dialog appears.
3. After a failed export of either kind, it does **not** appear.
4. Downloading a PDF and then a PNG shows the dialog after **each**.
6. Choosing **Keep this receipt** leaves every field, the photos and the stored draft
   exactly as they were.
7. Choosing **Start a new receipt** clears the form and the stored draft, through the same
   path the Clear draft button uses, and returns to the first step.
8. The downloaded file is never touched by either choice.
9. Escape and the backdrop both keep the receipt, and focus returns to where it was.
10. The dialog is announced to a screen reader with its title and description, and the
    keep action is the one focused on open.
11. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

Verified through the rendered DOM with user-event: both exports, both outcomes, the
once-only rule, the re-ask after an edit, and both choices.

**Not verifiable here:** how the dialog feels in sequence — whether it arrives as a helpful
offer or as an interruption between pressing Download and seeing the file. That is for the
author on screen, and it is the thing most likely to need a second opinion: a modal that
appears unasked after every download is a pattern people learn to dismiss without reading.

## Deferred

- Remembering a "do not ask again" preference.
- Offering to keep the parties and clear only the items, which is the likely real need for
  someone issuing several receipts to different customers.
