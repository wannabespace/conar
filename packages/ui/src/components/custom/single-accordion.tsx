import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { RiArrowDownSLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const ITEM_VALUE = 'accordion-item'

export function SingleAccordionTrigger({
  children,
  className,
  asChild,
  render,
  ...props
}: AccordionPrimitive.Trigger.Props & { asChild?: boolean }) {
  const resolvedRender = asChild && React.isValidElement(children)
    ? (children as React.ReactElement)
    : render

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          `
            flex flex-1 cursor-pointer items-center justify-between gap-4
            rounded-md p-2 text-left text-sm font-medium transition-all
            outline-none
            focus-visible:border-ring focus-visible:ring-[0.1875rem]
            focus-visible:ring-ring/50
            disabled:pointer-events-none disabled:opacity-50
            [&[data-panel-open]>svg]:rotate-180
          `,
          className,
        )}
        render={resolvedRender}
        {...props}
      >
        {asChild ? undefined : children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function SingleAccordionTriggerArrow({ className }: { className?: string }) {
  return (
    <RiArrowDownSLine className={cn(`
      pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground
      transition-transform duration-200
    `, className)}
    />
  )
}

export function SingleAccordionContent({ children, className, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="
        h-(--accordion-panel-height) overflow-hidden text-sm transition-[height]
        duration-200 ease-out
        data-ending-style:h-0
        data-starting-style:h-0
      "
      {...props}
    >
      <div className={cn('p-2', className)}>{children}</div>
    </AccordionPrimitive.Panel>
  )
}

export function SingleAccordion({ open, onOpenChange, children, className, ...props }: { open?: boolean, onOpenChange?: (open: boolean) => void } & Omit<AccordionPrimitive.Root.Props, 'value' | 'defaultValue' | 'onValueChange'>) {
  return (
    <AccordionPrimitive.Root
      className={cn('w-full rounded-lg border bg-card text-card-foreground', className)}
      value={open ? [ITEM_VALUE] : onOpenChange ? [] : undefined}
      onValueChange={(value) => {
        onOpenChange?.(value.includes(ITEM_VALUE))
      }}
      {...props}
    >
      <AccordionPrimitive.Item value={ITEM_VALUE}>
        {children}
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
