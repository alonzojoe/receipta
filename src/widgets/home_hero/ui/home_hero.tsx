import { Link } from '@tanstack/react-router'
import { LuArrowRight } from 'react-icons/lu'

import { CtaButton } from '@/shared/ui/cta_button'
import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

import { MockReceipt } from './mock_receipt'

export function HomeHero() {
  return (
    <Section className="relative overflow-hidden pt-12 pb-10 sm:pt-20 sm:pb-12">
      {/*
        Decorative depth. A flat white hero reads as unfinished; a single soft violet
        wash ties the page to the brand without competing with the content. Purely
        presentational, so it is hidden from assistive tech and ignores pointers.
      */}
      <div
        aria-hidden="true"
        className="brand-glow pointer-events-none absolute inset-x-0 -top-1/3 -z-10 mx-auto aspect-square w-full max-w-2xl blur-2xl"
      />

      <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex w-full flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              Free, and nothing leaves your device
            </span>
          </Reveal>

          <Reveal delay={50}>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Send receipts, not screenshots.
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Receipta turns a GCash, Maya, MariBank, or bank transfer payment into a
              clean receipt you can send in seconds. No signup, no fees, and nothing
              leaves your device.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CtaButton asChild>
                <Link to="/create">
                  Create a receipt
                  <LuArrowRight aria-hidden="true" />
                </Link>
              </CtaButton>
              <CtaButton variant="outline" asChild>
                <Link to="/" hash="how-it-works">
                  How it works
                </Link>
              </CtaButton>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="flex w-full justify-center lg:justify-end">
          <MockReceipt />
        </Reveal>
      </div>
    </Section>
  )
}
