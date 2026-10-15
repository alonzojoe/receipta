import { LuArrowLeft, LuArrowRight } from 'react-icons/lu'

import { CtaButton } from '@/shared/ui/cta_button'

type StepNavProps = {
  show_back: boolean
  show_next: boolean
  on_back: () => void
}

/**
 * Back and Next, together at the bottom of the step. Full width and at least 44px tall on
 * a phone. Next is the form's only `type="submit"`, so Enter in a text field advances
 * while Enter on any other button activates that button.
 */
export function StepNav({ show_back, show_next, on_back }: StepNavProps) {
  if (!show_back && !show_next) return null
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      {show_back ? (
        <CtaButton type="button" variant="outline" className="w-full sm:w-auto" onClick={on_back}>
          <LuArrowLeft aria-hidden="true" />
          Back
        </CtaButton>
      ) : (
        <span />
      )}
      {show_next && (
        <CtaButton type="submit" className="w-full sm:w-auto">
          Next
          <LuArrowRight aria-hidden="true" />
        </CtaButton>
      )}
    </div>
  )
}
