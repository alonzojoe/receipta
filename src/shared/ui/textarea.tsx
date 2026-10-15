import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { control_classes } from "@/shared/ui/control_style"

// The look is not defined here: it is `control_classes`, shared with Input.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(control_classes, "block field-sizing-content min-h-24", className)}
      {...props}
    />
  )
}

export { Textarea }
