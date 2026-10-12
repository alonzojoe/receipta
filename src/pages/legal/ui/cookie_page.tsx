import { legal_contact_url, stored_items } from '@/shared/config/legal'
import { LegalDocument } from '@/widgets/legal_document'
import { SiteFooter } from '@/widgets/site_footer'
import { SiteHeader } from '@/widgets/site_header'

export function CookiePage() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <LegalDocument
          title="Cookie Policy"
          summary="Receipta does not use cookies. Here is what it uses instead, and why."
        >
          <section>
            <h2>Receipta sets no cookies</h2>
            <p>
              Not for analytics, not for advertising, not for sessions. There are no
              third-party cookies either, because no third-party scripts run on this
              site. That is also why you have never seen a cookie banner here: there is
              nothing to ask you to consent to.
            </p>
          </section>

          <section>
            <h2>What is used instead</h2>
            <p>
              Receipta uses local storage, which is a small amount of space your browser
              sets aside for a site. The practical difference from a cookie matters: a
              cookie is attached to every request your browser makes to a server,
              whereas local storage is never transmitted. It stays on your machine and
              is only read by the page itself.
            </p>
            <p>
              Since Receipta has no server to send anything to, nothing is transmitted
              either way.
            </p>
          </section>

          <section>
            <h2>What is stored</h2>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Purpose</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Values</th>
                  <th scope="col" className="py-2 font-medium">How long</th>
                </tr>
              </thead>
              <tbody>
                {stored_items.map((item) => (
                  <tr key={item.key} className="border-b border-border align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">
                      {item.key}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.purpose}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.values}</td>
                    <td className="py-3 text-muted-foreground">{item.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2>What is not stored</h2>
            <p>
              Your receipts are not saved. The names, amounts, payment details and
              photos you enter live in the page&rsquo;s memory while it is open and are
              discarded when you close the tab. Nothing about your receipts is written
              to local storage, and nothing is uploaded.
            </p>
          </section>

          <section>
            <h2>Clearing it</h2>
            <p>
              Clear site data for Receipta in your browser settings and the stored
              preference goes with it. Private or incognito browsing discards it when
              you close the window. Removing it only means the app forgets your theme
              choice next time.
            </p>
          </section>

          <section>
            <h2>Changes</h2>
            <p>
              If Receipta ever starts storing anything else, the table above will be
              updated before that change ships. See also the{' '}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions can be raised on the{' '}
              <a href={legal_contact_url} target="_blank" rel="noopener noreferrer">
                project repository
              </a>
              .
            </p>
          </section>
        </LegalDocument>
      </main>
      <SiteFooter />
    </div>
  )
}
