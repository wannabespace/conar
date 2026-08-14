import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { RiArrowDownSLine, RiArrowUpSLine } from '@remixicon/react'
import { cn } from '@tamery/ui/lib/utils'

const Accordion = ({ className, ...props }: AccordionPrimitive.Root.Props) => (
  <AccordionPrimitive.Root
    data-slot="accordion"
    className={cn(
      'flex w-full flex-col overflow-hidden rounded-2xl border',
      className
    )}
    {...props}
  />
)

const AccordionItem = ({
  className,
  ...props
}: AccordionPrimitive.Item.Props) => (
  <AccordionPrimitive.Item
    data-slot="accordion-item"
    className={cn(`data-open:bg-muted/50 not-last:border-b`, className)}
    {...props}
  />
)

const AccordionTrigger = ({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        `group/accordion-trigger **:data-[slot=accordion-trigger-icon]:text-muted-foreground relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left text-sm font-medium transition-all outline-none hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4`,
        className
      )}
      {...props}
    >
      {children}
      <RiArrowDownSLine
        data-slot="accordion-trigger-icon"
        className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
      />
      <RiArrowUpSLine
        data-slot="accordion-trigger-icon"
        className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
)

const AccordionContent = ({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) => (
  <AccordionPrimitive.Panel
    data-slot="accordion-content"
    className="data-open:animate-accordion-down data-closed:animate-accordion-up overflow-hidden px-4 text-sm"
    {...props}
  >
    <div
      className={cn(
        `[&_a]:hover:text-foreground h-(--accordion-panel-height) pt-0 pb-4 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4`,
        className
      )}
    >
      {children}
    </div>
  </AccordionPrimitive.Panel>
)

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
