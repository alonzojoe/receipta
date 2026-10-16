import type { IconType } from 'react-icons'
import { LuCheck, LuFileText, LuList, LuUsers, LuWallet } from 'react-icons/lu'

import { cn } from '@/shared/lib/utils'

import { step_labels, steps, type StepName, type StepNumber } from '../model/step_rules'

type StepTimelineProps = {
  current: StepNumber
  /** Only ever called for a completed step. */
  on_select: (step: StepNumber) => void
  /** A second line per step, where it says something. See `timeline_details`. */
  details?: Partial<Record<StepName, string>>
}

type StepState = 'completed' | 'current' | 'upcoming'

const state_text: Record<StepState, string> = {
  completed: 'completed',
  current: 'current',
  upcoming: 'not yet reached',
}

/** People, a list, a wallet, a document: four glyphs that tell the steps apart unread. */
const step_icons: Record<StepName, IconType> = {
  parties: LuUsers,
  items: LuList,
  payment: LuWallet,
  review: LuFileText,
}

/**
 * The map beside the form. One ordered list, two shapes, the same words for a screen
 * reader at every width.
 *
 * From `lg` it is a card, sticky under the header: a title with the overall position and a
 * thin bar showing how far through the four steps you are, then one row per step.
 *
 * - **State reads without the label.** Done is a solid violet disc with a tick, which
 *   overrides the step's glyph. Current is an open disc with a violet rim and halo holding
 *   the glyph, on its own tinted row with a violet edge, so the eye lands there first.
 *   Upcoming is a dashed grey disc holding the glyph, on a plain row.
 * - **The line is progress.** It fills violet, top down, as the step above completes, and
 *   it meets the discs at both ends.
 * - **What it allows is visible before the click.** Completed rows are buttons: pointer
 *   cursor, a tint on hover, a focus ring. Upcoming rows are plain text with a default
 *   cursor and a dashed disc, so nothing pressable does nothing. Next stays the only way
 *   forward; "completed" means earlier than the current step.
 * - **A second line only where it says something** (see `timeline_details`).
 *
 * Below `lg` it is inline with no card, because a panel around a line of text costs the
 * form its vertical space on a phone: "Step 2 of 4" with the current step's glyph and
 * name, over four segments that are full when done, half when current, empty when upcoming.
 *
 * Motion is `transform` at 200ms ease-out, as the accordion is. Under reduced motion the
 * scale is dropped and the fills fade instead.
 */
export function StepTimeline({ current, on_select, details = {} }: StepTimelineProps) {
  const CurrentIcon = step_icons[steps[current - 1]]

  return (
    <nav
      aria-label="Receipt steps"
      className="flex flex-col gap-3 lg:sticky lg:top-24 lg:gap-2 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-3"
    >
      {/* Strip header. */}
      <p aria-hidden="true" className="flex items-center gap-2 text-sm font-medium text-foreground lg:hidden">
        <span className="flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CurrentIcon className="size-3.5" />
        </span>
        <span>
          <span className="text-muted-foreground">
            Step {current} of {steps.length}
          </span>{' '}
          - {step_labels[steps[current - 1]]}
        </span>
      </p>

      {/* Card header: the title, the position, and the overall bar. */}
      <div aria-hidden="true" className="hidden flex-col gap-3 px-2 pt-2 pb-3 lg:flex">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-base font-semibold tracking-tight">Progress</p>
          <p className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
            Step {current} of {steps.length}
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${current / steps.length})` }}
          />
        </div>
      </div>

      <ol className="flex w-full gap-2 lg:flex-col lg:gap-1">
        {steps.map((step, index) => {
          const number = (index + 1) as StepNumber
          const state: StepState =
            number < current ? 'completed' : number === current ? 'current' : 'upcoming'
          const is_last = number === steps.length
          const Icon = step_icons[step]
          const detail = state === 'upcoming' ? undefined : details[step]

          const content = (
            <>
              {/* Strip: a segment, with a fill that grows from the left. */}
              <span
                aria-hidden="true"
                className="relative block h-1.5 w-full overflow-hidden rounded-full bg-border lg:hidden"
              >
                <span
                  className={cn(
                    'absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-200 ease-out',
                    'motion-reduce:scale-x-100 motion-reduce:transition-opacity',
                    state === 'completed' && 'scale-x-100',
                    state === 'current' && 'scale-x-50 motion-reduce:opacity-60',
                    state === 'upcoming' && 'scale-x-0 motion-reduce:opacity-0',
                  )}
                />
              </span>

              {/* Rail: the disc, and the line that runs on to the next one. The line is
                  pulled down into the next row's top padding (-mb-3) and lifted (z-10)
                  so it touches both discs. */}
              <span aria-hidden="true" className="hidden flex-col items-center self-stretch pt-3 lg:flex">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color,box-shadow] duration-200 ease-out',
                    state === 'completed' &&
                      'bg-primary text-primary-foreground group-hover/step:bg-primary/85',
                    // Dark only, and a FILL rather than ink: the mark violet is too dark to
                    // read as a number or a 1px rim on this row. White on it measures
                    // 6.55:1, the same pairing as the primary button, which is what the
                    // active step is meant to echo. The lavender rim stays - it defines
                    // the disc's edge at ~6:1 against the row, where a violet rim would
                    // leave that edge at ~2.5:1.
                    //
                    // The progress line and bar stay on --primary deliberately. The mark
                    // violet separated from its own empty track at only 1.89:1 in dark,
                    // against ~4.5:1 for lavender: both are dark colours, so the filled
                    // and empty halves of a gauge stopped being distinguishable. The
                    // violet belongs on the disc, which is identified by its rim and its
                    // white content, not on a bar whose only job is a boundary.
                    state === 'current' &&
                      'border-2 border-primary bg-card text-primary ring-4 ring-primary/20 dark:bg-brand-fill dark:text-brand-fill-foreground',
                    state === 'upcoming' &&
                      'border border-dashed border-control-border bg-muted text-muted-foreground',
                  )}
                >
                  {state === 'completed' ? <LuCheck className="size-4" /> : <Icon className="size-4" />}
                </span>
                {!is_last && (
                  <span className="relative z-10 -mb-3 mt-1 min-h-3 w-0.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className={cn(
                        'absolute inset-0 origin-top bg-primary transition-transform duration-200 ease-out',
                        'motion-reduce:scale-y-100 motion-reduce:transition-opacity',
                        state === 'completed' ? 'scale-y-100' : 'scale-y-0 motion-reduce:opacity-0',
                      )}
                    />
                  </span>
                )}
              </span>

              {/* The label's first line is centred on the disc: 12px row padding + half
                  the 12px by which the 32px disc is taller than a 20px line = 18px. */}
              <span className="flex min-w-0 flex-col lg:pt-4.5 lg:pb-3">
                <span
                  className={cn(
                    'text-sm leading-5',
                    state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                    state === 'current' && 'font-semibold',
                    state === 'completed' && 'font-medium group-hover/step:underline',
                  )}
                >
                  {step_labels[step]}
                  <span className="sr-only"> ({state_text[state]})</span>
                </span>
                {detail !== undefined && (
                  <span
                    className="mt-0.5 hidden break-words text-sm leading-5 text-muted-foreground lg:line-clamp-2"
                    title={detail}
                  >
                    {detail}
                  </span>
                )}
              </span>
            </>
          )

          const layout =
            'group/step flex min-h-11 w-full flex-col items-start gap-1.5 rounded-lg text-left lg:min-h-16 lg:flex-row lg:gap-3 lg:px-3'

          return (
            <li
              key={step}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col rounded-lg transition-colors duration-200 ease-out lg:flex-none',
                // The current row is a row: its own surface and a violet edge.
                state === 'current' &&
                  'lg:bg-surface-accent lg:before:absolute lg:before:inset-y-2 lg:before:left-0 lg:before:w-1 lg:before:rounded-r-full lg:before:bg-primary',
              )}
            >
              {state === 'completed' ? (
                <button
                  type="button"
                  onClick={() => on_select(number)}
                  className={cn(
                    layout,
                    'cursor-pointer outline-none transition-colors duration-150 ease-out hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className={cn(layout, state === 'upcoming' && 'cursor-not-allowed')}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
