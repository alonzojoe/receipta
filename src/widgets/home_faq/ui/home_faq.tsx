import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion'
import { default_open_id, questions } from '../model/questions'

/**
 * A plain list on the section's own tinted surface: no per-item background, no shadow,
 * hairline borders between rows (each row's separator is owned by AccordionItem; the list
 * only adds the top edge). The author asked for rows that inherit the section.
 *
 * With no surface to shift, hover is carried by the text and the plus-minus icon turning to the
 * brand colour. The focus ring is inset on the trigger, so it can never be clipped by
 * the row or the section.
 */
const trigger_class =
  'min-h-11 rounded-lg px-3 py-5 text-base font-medium tracking-tight text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

const content_class = 'px-3 pb-5 text-muted-foreground'

export function HomeFaq() {
  return (
    <Section id="faq" className="bg-surface-tint">
      <Reveal>
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mx-auto max-w-xl text-balance text-muted-foreground">
            The things worth knowing before you send your first receipt.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <Accordion
          type="single"
          collapsible
          defaultValue={default_open_id}
          className="mx-auto mt-12 max-w-3xl border-t border-border"
        >
          {questions.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className={trigger_class}>{item.question}</AccordionTrigger>
              <AccordionContent className={content_class}>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  )
}
