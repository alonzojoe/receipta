# Philippine Financial Institutions Dataset — Requirements

## Goal

A JSON dataset of the banks, digital banks and e-wallets Filipinos actually get paid
through, so the receipt builder can offer a real payment-method picker instead of the
four hardcoded labels it has now.

## Why now

`shared/config/site.ts` currently holds four payment modes as plain strings: GCash,
Maya, MariBank, Bank Transfer. "Bank Transfer" is a category pretending to be a choice.
Someone paid through BPI wants their receipt to say BPI.

## The schema

Trimmed to what the product uses. `instapay` and `website` from the sample are dropped.

```jsonc
{
  "country": "PH",
  "updated": "2026-10-13",
  "institutions": [
    {
      "id": "gcash",              // stable slug, safe as a storage value
      "name": "GCash",            // display name
      "category": "ewallet",      // ewallet | digital_bank | local_bank
      "institutionType": "...",   // the regulatory classification
      "icon": "/institutions/gcash.png"
    }
  ]
}
```

### Why `website` cannot simply be deleted

The sample derives its icon from the domain:
`https://www.google.com/s2/favicons?domain=gcash.com`. Removing `website` removes the
thing the icon is built from. This is resolved by **not** building icons at runtime at
all - see below - so the stored value is a local path and no domain is needed in the
shipped data. The domain is still needed during the build step that produces the icons,
and lives in the fetch script, not in the dataset.

### `id`

Lowercase, hyphenated, stable. It is the value that would be written into a saved
receipt, so renaming one later breaks stored data. Chosen once and not revised for
cosmetic reasons.

### Categories

| `category` | Means |
| --- | --- |
| `ewallet` | Electronic money issuer, not a bank. GCash, Maya wallet, ShopeePay. |
| `digital_bank` | Holds a BSP digital banking licence. |
| `local_bank` | A traditional bank with branches. |

`institutionType` carries the finer regulatory classification, for example
`universal_commercial_bank`, `thrift_bank`, `digital_bank`, `non_bank_emi`.

## Icons must be served locally

**This is the part that is not negotiable.**

The Privacy Policy published yesterday states, in the list of things Receipta does not
do: *"No third-party requests. Even the fonts are served from Receipta itself rather
than an external provider, so loading the page does not tell anyone else that you
visited."*

Pointing icons at `google.com/s2/favicons` would:

1. **Make that statement false.** The product's central claim is that nothing leaves
   your device. A page that quietly calls Google contradicts its own policy page.
2. **Leak behaviour to a third party.** Every time the payment picker opens, Google
   receives a request revealing the visitor's IP, the referring page, and which
   institutions were displayed - which is close to revealing how the person gets paid.
3. **Add a runtime dependency.** The picker degrades to broken images if the service
   changes, rate-limits, or is blocked.

So: icons are fetched **once, at authoring time**, written into `public/institutions/`,
and referenced by local path. The dataset ships with the images.

If for any reason icons end up loaded from a third party, the Privacy Policy must be
corrected in the same change. A false privacy claim is worse than an ugly picker.

## Scope

### Included

- **Digital banks** - all BSP-licensed ones. There are few and they matter to this
  audience.
- **Universal and commercial banks** - the ones people actually receive transfers into.
- **E-wallets and EMIs** - the major ones in real use.

### Excluded

- Rural banks, cooperative banks, and most thrift banks. BSP licenses hundreds; a
  picker listing them all is unusable, and this audience does not get paid through them.
- Foreign bank branches with no retail presence.
- Remittance-only operators, unless they are genuinely used to receive payment.
- Anything defunct, merged, or whose licence has lapsed.

Target size is roughly 40 to 60 entries. If it grows past that, the scope is wrong.

## Accuracy

The dataset makes factual claims about regulated institutions, so it is researched, not
recalled.

- **Primary source is BSP** - the Bangko Sentral ng Pilipinas publishes directories of
  licensed banks, digital banks, and EMIs. That is the authority for who exists and how
  they are classified.
- Each institution's **own site** confirms its current trading name.
- Names are the trading name a customer recognises, not the full registered legal name.
  `BDO Unibank`, not `BDO Unibank, Inc.`
- Anything that cannot be confirmed from a source is left out. A plausible guess in a
  financial dataset is a defect.
- The file carries an `updated` date, because this data goes stale: banks merge, digital
  banks get licensed, wallets shut down.

## Where it lives

`src/shared/config/institutions.json`, with a typed accessor beside it so consumers do
not import raw JSON and lose type safety.

The existing `payment_modes` array in `site.ts` is **not** removed in this change. The
home page's payment strip still uses it. Migrating that is a separate, visible change.

## Out of scope

- The payment picker UI. This is the data only.
- Wiring it into the receipt builder. That is Phase 1.
- Account numbers, branch data, SWIFT or BIC codes, routing numbers.
- Any claim about which institutions support InstaPay or PESONet. Dropped from the
  schema and not researched - stating it wrongly would mislead someone about whether a
  transfer will arrive.

## Acceptance criteria

1. `institutions.json` exists, parses, and matches the documented schema
2. Every entry has `id`, `name`, `category`, `institutionType`, `icon`
3. `id` values are unique, lowercase, hyphenated
4. Every `icon` is a local path under `/institutions/`, and the file exists
5. **No icon URL points at a third-party service**
6. All BSP-licensed digital banks are present
7. Entry count is between 40 and 60
8. Every entry traces to a source; unverifiable ones are absent
9. A typed accessor exists and the JSON is not imported raw by consumers
10. The `updated` date is present and correct
11. `npm run build`, `npm run lint`, `npm test` all exit 0
