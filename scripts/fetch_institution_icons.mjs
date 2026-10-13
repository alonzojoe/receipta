/*
 * Fetches each institution's favicon once and writes it into public/institutions/.
 *
 * Run by hand, never on build. The published Privacy Policy states that Receipta makes
 * no third-party requests, so icons cannot be loaded from a favicon service at runtime:
 * that would make the claim false and would tell a third party which institutions a
 * visitor was shown, which is close to telling them how that person gets paid.
 *
 * The domains live here rather than in the dataset, because the shipped data only needs
 * the local path.
 *
 *   node scripts/fetch_institution_icons.mjs
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import institutions from '../src/shared/config/institutions.json' with { type: 'json' }

const domains = {
  gcash: 'gcash.com',
  maya: 'maya.ph',
  shopeepay: 'shopee.ph',
  grabpay: 'grab.com',
  'coins-ph': 'coins.ph',

  gotyme: 'gotyme.com.ph',
  'maya-bank': 'maya.ph',
  maribank: 'maribank.com.ph',
  ofbank: 'ofbank.com.ph',
  tonik: 'tonikbank.com',
  uniondigital: 'uniondigitalbank.io',
  unobank: 'unobank.ph',

  'al-amanah': 'amanahbank.gov.ph',
  aub: 'aub.com.ph',
  bankcom: 'bankcom.com.ph',
  bdo: 'bdo.com.ph',
  bpi: 'bpi.com.ph',
  chinabank: 'chinabank.ph',
  cimb: 'cimbbank.com.ph',
  ctbc: 'ctbcbank.com.ph',
  dbp: 'dbp.ph',
  eastwest: 'eastwestbanker.com',
  hsbc: 'hsbc.com.ph',
  landbank: 'landbank.com',
  maybank: 'maybank.com.ph',
  metrobank: 'metrobank.com.ph',
  pbcom: 'pbcom.com.ph',
  philtrust: 'philtrustbank.com',
  pnb: 'pnb.com.ph',
  rcbc: 'rcbc.com',
  'security-bank': 'securitybank.com',
  unionbank: 'unionbankph.com',
  'veterans-bank': 'veteransbank.com.ph',
}

/*
 * Direct icon URLs for sites whose favicon neither icon service has cached and whose
 * /favicon.ico is not where it should be. Found by reading each site's declared
 * <link rel="icon">, not by guessing paths.
 */
const overrides = {
  maribank:
    'https://banking-aka-storage.maribank.ph/seabank/ph/cmps-website/page-resource/live/static/20261013/20_00_00__of984f/ph/favicon-ph.png',
  unobank: 'https://www.uno.bank/wp-content/uploads/2022/05/UNO-Favicon.svg',
  bankcom:
    'https://www.bankcom.com.ph/wp-content/themes/bankofcommerce/images/favicon.ico',
  pbcom: 'https://www.pbcom.com.ph/sites/default/files/2019%20P%20-%20FAVICON.ico',
}

const out_dir = new URL('../public/institutions/', import.meta.url)
await mkdir(out_dir, { recursive: true })

const seen = new Map()
const failed = []

for (const institution of institutions.institutions) {
  const domain = domains[institution.id]
  if (!domain) {
    failed.push(`${institution.id}: no domain mapped`)
    continue
  }

  /*
   * Several sources, tried in order. Google's service 404s for any domain it has not
   * cached, which turned out to be a third of this list, so the institution's own
   * favicon is tried first and DuckDuckGo's service is the fallback.
   */
  const sources = [
    ...(overrides[institution.id] ? [overrides[institution.id]] : []),
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://${domain}/favicon.ico`,
    `https://www.${domain}/favicon.ico`,
  ]

  try {
    let bytes = null
    let used = null
    const errors = []

    for (const url of sources) {
      try {
        const response = await fetch(url, {
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          },
        })
        if (!response.ok) {
          errors.push(`${new URL(url).host} HTTP ${response.status}`)
          continue
        }
        const candidate = Buffer.from(await response.arrayBuffer())
        if (candidate.length < 200) {
          errors.push(`${new URL(url).host} ${candidate.length}b`)
          continue
        }
        bytes = candidate
        used = new URL(url).host
        break
      } catch (error) {
        errors.push(`${new URL(url).host} ${error.message}`)
      }
    }

    if (!bytes) throw new Error(errors.join('; '))

    // A favicon service returns a generic globe for domains it does not know. Shipping
    // thirty identical globes is worse than shipping none, so duplicates are reported.
    const hash = createHash('sha1').update(bytes).digest('hex')
    if (seen.has(hash)) {
      // Maya Bank and the Maya wallet are one brand on one domain, so sharing a mark is
      // correct rather than a placeholder. Anything else matching is suspicious.
      const twin = seen.get(hash)
      const same_brand = [institution.id, twin].sort().join(',') === 'maya,maya-bank'
      if (!same_brand) {
        failed.push(`${institution.id}: identical to ${twin} - likely a placeholder`)
      }
    } else {
      seen.set(hash, institution.id)
    }

    // Some sources hand back .ico or .svg. Normalise everything to a 128px PNG so the
    // picker never has to care what a given bank happened to publish.
    // ImageMagick identifies by extension, and these arrive without one, so the format
    // is read from the magic bytes instead of trusted from the URL.
    const head = bytes.subarray(0, 12)
    let ext = 'png'
    if (head[0] === 0x89 && head.toString('latin1', 1, 4) === 'PNG') ext = 'png'
    else if (head[0] === 0x00 && head[1] === 0x00 && head[2] === 0x01) ext = 'ico'
    else if (head[0] === 0xff && head[1] === 0xd8) ext = 'jpg'
    else if (head.toString('latin1', 0, 4) === 'GIF8') ext = 'gif'
    else if (head.toString('latin1', 0, 4) === 'RIFF') ext = 'webp'
    else if (bytes.toString('latin1', 0, 400).includes('<svg')) ext = 'svg'

    const tmp = new URL(`.${institution.id}.src.${ext}`, out_dir)
    await writeFile(tmp, bytes)
    execFileSync('magick', [
      fileURLToPath(tmp) + '[0]',
      '-background', 'none',
      '-resize', '128x128',
      fileURLToPath(new URL(`${institution.id}.png`, out_dir)),
    ])
    await rm(tmp, { force: true })
    console.log(`  ok   ${institution.id.padEnd(16)} ${String(bytes.length).padStart(6)}b  via ${used}`)
  } catch (error) {
    // A failed conversion leaves its temp file behind; clear any stragglers so a later
    // run does not count them as icons.
    for (const ext of ['png', 'ico', 'jpg', 'gif', 'webp', 'svg']) {
      await rm(new URL(`.${institution.id}.src.${ext}`, out_dir), { force: true })
    }
    failed.push(`${institution.id}: ${error.message}`)
    console.log(`  FAIL ${institution.id.padEnd(16)} ${error.message}`)
  }
}

console.log(`\n${institutions.institutions.length - failed.length} written, ${failed.length} need attention`)
for (const line of failed) console.log(`  - ${line}`)
