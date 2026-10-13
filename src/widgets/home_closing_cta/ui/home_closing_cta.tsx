import { Link } from '@tanstack/react-router'
import { LuArrowRight } from 'react-icons/lu'

import { CtaButton } from '@/shared/ui/cta_button'
import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

export function HomeClosingCta() {
  return (
    <Section className="pb-20 sm:pb-24">
      <Reveal>
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface-accent px-6 py-14 text-center shadow-sm sm:px-12">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next receipt takes about a minute
          </h2>
          <p className="max-w-xl text-balance text-muted-foreground">
            Nothing to install, nothing to sign up for. Open it and start typing.
          </p>
          <CtaButton asChild>
            <Link to="/create">
              Create a receipt
              <LuArrowRight aria-hidden="true" />
            </Link>
          </CtaButton>
        </div>
      </Reveal>
    </Section>
  )
}
