import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { LuMinus, LuPlus } from "react-icons/lu"

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex w-full flex-1 items-start justify-between gap-4 text-left text-sm font-medium transition-[color,background-color] duration-150 ease-out outline-none disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          data-slot="accordion-trigger-icon"
          className="pointer-events-none relative shrink-0 text-muted-foreground transition-colors duration-150 ease-out"
        >
          {/* Plus and minus are stacked and crossfaded. Only opacity and transform move;
              the rotation is dropped under reduced motion, the fade is kept. */}
          <LuPlus className="transition-opacity duration-200 ease-out group-aria-expanded/accordion-trigger:opacity-0 motion-safe:transition-[opacity,transform] motion-safe:group-aria-expanded/accordion-trigger:rotate-90" />
          <LuMinus className="absolute inset-0 opacity-0 transition-opacity duration-200 ease-out group-aria-expanded/accordion-trigger:opacity-100 motion-safe:transition-[opacity,transform] motion-safe:-rotate-90 motion-safe:group-aria-expanded/accordion-trigger:rotate-0" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm motion-safe:data-[state=open]:animate-accordion-reveal motion-safe:data-[state=closed]:animate-accordion-conceal"
      {...props}
    >
      <div className={cn(className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
