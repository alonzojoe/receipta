import { LuShieldCheck } from 'react-icons/lu'

import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

export function HomePrivacy() {
  return (
    <Section>
      <Reveal>
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-12">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <LuShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Your receipts never leave your device
          </h2>
          <p className="max-w-2xl text-balance text-muted-foreground">
            Receipta has no account and no server. Your customers&rsquo; names, your
            amounts, and your item photos are handled entirely inside your browser, and
            the finished file is saved straight to your device. There is nothing for us
            to store, because we never receive any of it.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
