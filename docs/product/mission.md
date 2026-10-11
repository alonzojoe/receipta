# Mission

## What Receipta is

Receipta is a browser-based receipt generator. You fill in who you are, who you are
billing, what you sold, and how you were paid. Receipta renders a clean receipt and
exports it as a PDF or an image you can send straight to your client.

It is not an accounting system, an invoicing platform, or a BIR-compliant official
receipt. It produces a presentable proof-of-payment document, fast.

## Who it is for

Small sellers and independent workers in the Philippines who get paid through GCash,
Maya, MariBank, or bank transfer and need to hand the client something that looks
deliberate instead of a screenshot of a chat thread.

Two issuer shapes, same flow:

- **Individual** — a freelancer, artist, or reseller issuing under their own name
- **Organization** — a small business issuing under a company name

## Why it exists

Getting paid digitally is solved in the Philippines. *Acknowledging* the payment is
not. The default is a forwarded transaction screenshot, which looks careless and
carries none of the seller's identity. Receipta closes that gap without asking anyone
to sign up for accounting software.

## The flow

1. **Issuer** — your name, or your company name
2. **Client** — who the receipt is for
3. **Items** — one or more line items, each with a name, quantity, unit price, and an
   optional image
4. **Payment** — the mode, picked from a dropdown showing each provider's logo
5. **Summary** — review the finished receipt before committing to it
6. **Export** — download as PDF or image, then send it however you already talk to
   your client

## Product decisions

These are settled and the spec depends on them.

| Decision | Choice |
| --- | --- |
| Currency | PHP only, formatted `₱1,234.56`, always two decimals |
| Item line | name + quantity × unit price → subtotal |
| Item image | one per item, optional |
| Totals | subtotal → optional discount → total. No VAT line. |
| Payment modes | GCash, Maya, MariBank, Bank Transfer |
| Payment icons | local brand SVGs, since react-icons carries no PH fintech logos |
| Receipt No. | auto-generated, `REF-YYYYMMDD-HHMMSS` |
| Payment Reference No. | optional, typed in by the issuer from their payment app |
| Backend | none. Front-end only, deployable as static files. |
| Accounts | none. No login, no sync. |
| Persistence | issuer name saved in the browser so it pre-fills next time |
| Receipt history | not in v1 |

## Deliberately out of scope

- **No BIR official receipts.** A legal OR has numbering, registration, and retention
  requirements this tool does not attempt to meet. Receipta is a proof-of-payment
  document, and the product should never imply otherwise.
- **No VAT computation.** Out of scope follows from the above.
- **No accounts, server, or sync.** Receipt data never leaves the user's machine. This
  is a privacy feature, not just a shortcut.
- **No multi-currency.** PHP only.
- **No payment processing.** Receipta documents a payment that already happened; it
  never moves money.

## Working assumptions

Recorded so they are visible and cheap to overturn.

- **Two separate numbers, not one.**
  - **Receipt No.** is Receipta's own identifier, auto-generated from the timestamp as
    `REF-YYYYMMDD-HHMMSS` (for example `REF-20261011-224818`). Seconds, not
    milliseconds: one person cannot submit two receipts in the same second, so the extra
    digits are noise on a number a client may read aloud.
  - **Payment Reference No.** is the transaction ID GCash or the bank issued. It is an
    optional free-text field the issuer pastes in. It is deliberately *not* generated,
    because its only value is that the client can match it against their own transaction
    history — a generated one would look verifiable while being meaningless.
- **Both PDF and image export ship in v1.** PDF for email and printing, PNG for chat
  apps, which is where most Filipino clients actually want it.
- **Images are embedded client-side.** With no server, item images are read in the
  browser and embedded into the export. They will be downscaled before embedding so a
  few phone photos do not produce a bloated file.

## Open questions

- Is **MariBank** the intended provider, or **SeaBank**? MariBank operates in
  Singapore; SeaBank is the Philippine digital bank under the same parent. Worth
  confirming before logo assets are sourced.
- Where do the brand logo SVGs come from, and are we comfortable displaying them as
  payment-method indicators?
