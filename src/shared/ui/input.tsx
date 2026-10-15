import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { control_classes } from "@/shared/ui/control_style"

// The look is not defined here: it is `control_classes`, shared with Textarea. Re-running
// `shadcn add input --overwrite` would undo this one import, so keep it.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(control_classes, className)}
      {...props}
    />
  )
}

export { Input }
