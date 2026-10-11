import { HomeClosingCta } from '@/widgets/home_closing_cta'
import { HomeFeatures } from '@/widgets/home_features'
import { HomeHero } from '@/widgets/home_hero'
import { HomePaymentModes } from '@/widgets/home_payment_modes'
import { HomePrivacy } from '@/widgets/home_privacy'
import { HomeSteps } from '@/widgets/home_steps'
import { SiteFooter } from '@/widgets/site_footer'
import { SiteHeader } from '@/widgets/site_header'

/**
 * Composition root for the marketing page. Holds no logic and no styling beyond the
 * order of the sections.
 */
export function HomePage() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <HomeHero />
        <HomePaymentModes />
        <HomeSteps />
        <HomeFeatures />
        <HomePrivacy />
        <HomeClosingCta />
      </main>
      <SiteFooter />
    </div>
  )
}
