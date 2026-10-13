import { institutions } from '@/shared/config/institutions'
import { Marquee } from '@/shared/ui/marquee'
import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

/*
 * Seconds per institution, so the strip travels at the same speed whatever the dataset
 * grows to. A fixed total duration would make it faster every time a bank is added.
 *
 * Tuned by watching it: 1.1s read as a ticker rushing past rather than something you
 * could pick your own bank out of, which is the only reason the strip exists.
 */
const seconds_per_item = 2.6

export function HomePaymentModes() {
  return (
    <Section className="pt-4 pb-12 sm:pt-6 sm:pb-16">
      <Reveal>
        <div className="flex flex-col items-center gap-10">
          <p className="text-sm text-muted-foreground">
            Works with how you already get paid
          </p>

          <Marquee duration_seconds={institutions.length * seconds_per_item} className="py-1">
            {institutions.map((institution) => (
              <span
                key={institution.id}
                className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-5 py-3 text-base font-medium text-foreground/80 shadow-sm"
              >
                {/*
                  Not lazy-loaded: the strip is on screen immediately, and a lazy image
                  inside a translated track can pop in late within the fade zone.

                  Decorative: the name beside it carries the meaning, so a screen reader
                  reading "GCash logo, GCash" would be noise. Icons are the one place the
                  project allows a fixed dimension.
                */}
                <img
                  src={institution.icon}
                  alt=""
                  aria-hidden="true"
                  width={128}
                  height={128}
                  decoding="async"
                  className="size-7 shrink-0 rounded-md object-contain"
                />
                {institution.name}
              </span>
            ))}
          </Marquee>
        </div>
      </Reveal>
    </Section>
  )
}
