import { LuTrash2 } from 'react-icons/lu'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert_dialog'
import { Button } from '@/shared/ui/button'

type ClearDraftButtonProps = { on_confirm: () => void }

/** Destructive, so it asks. Cancel changes nothing. */
export function ClearDraftButton({ on_confirm }: ClearDraftButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" className="h-auto min-h-11 gap-2 px-3 text-base text-muted-foreground">
          <LuTrash2 aria-hidden="true" />
          Clear draft
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear this draft?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes everything you have entered, including photos, and starts a new
            receipt. It cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-auto min-h-11 text-base">Keep draft</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className="h-auto min-h-11 text-base" onClick={on_confirm}>
            Clear draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
