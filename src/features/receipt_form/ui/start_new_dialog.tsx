import { LuCircleCheckBig, LuFilePlus2 } from 'react-icons/lu'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert_dialog'

type StartNewDialogProps = {
  open: boolean
  on_open_change: (open: boolean) => void
  on_confirm: () => void
}

/**
 * Offered once the file is saved, because someone who has just downloaded their receipt is
 * usually finished with it - and the form otherwise keeps everything, so the next receipt
 * starts with the last one's items, amounts and photos still in place.
 *
 * The copy leads with the reassurance rather than the warning. A dialog that says "clears"
 * seconds after a download reads, for a moment, as though it might delete the file; saying
 * the download is safe first removes that before anything is asked. It then names what is
 * actually lost - the form and its photos - rather than "your data", because the photos are
 * the part someone would be annoyed to re-attach.
 *
 * It shares the Clear draft dialog's mechanism and its clearing path, but not its words:
 * that one is "I want to throw this away", this one is "I have finished with this".
 */
export function StartNewDialog({ open, on_open_change, on_confirm }: StartNewDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={on_open_change}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* The mark sits on the title's line rather than above it: a check in its own
              block reads as a status screen, and this is a question. It is a finished-state
              mark, not a warning one - the moment this interrupts is a success, the file is
              on the device, and an alert dialog's usual register would read as something
              having gone wrong. */}
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <LuCircleCheckBig className="size-3.5" />
            </span>
            Downloaded. Start a new receipt?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            Your file is saved and nothing here can change that. Starting a new receipt
            clears this form and its photos, and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Full width and stacked on a phone, so neither choice is a small target, and the
            safe one sits under the thumb rather than beside the destructive one. */}
        <AlertDialogFooter className="gap-2 sm:gap-3">
          <AlertDialogCancel className="h-auto min-h-11 w-full text-sm sm:w-auto">
            Keep this receipt
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="h-auto min-h-11 w-full gap-2 text-sm sm:w-auto"
            onClick={on_confirm}
          >
            <LuFilePlus2 aria-hidden="true" className="size-4" />
            Start a new receipt
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
