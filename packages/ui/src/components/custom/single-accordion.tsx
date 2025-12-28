import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'

export function SingleAccordionTrigger({ children, className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          `
            flex flex-1 cursor-pointer items-center justify-between gap-4
            rounded-md p-2 text-left text-sm font-medium transition-all
            outline-none
            focus-visible:border-ring focus-visible:ring-[3px]
            focus-visible:ring-ring/50
            disabled:pointer-events-none disabled:opacity-50
            [&[data-state=open]>svg]:rotate-180
          `,
          className,
        )}
        {...props}
      >
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function SingleAccordionTriggerArrow({ className }: { className?: string }) {
  return (
    <ChevronDownIcon className={cn(`
      pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground
      transition-transform duration-200
    `, className)}
    />
  )
}

export function SingleAccordionContent({ children, className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={`
        overflow-hidden text-sm
        data-[state=closed]:animate-accordion-up
        data-[state=open]:animate-accordion-down
      `}
      {...props}
    >
      <div className={cn('px-2 py-2', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export function SingleAccordion({ open, onOpenChange, children, className, ...props }: { open?: boolean, onOpenChange?: (open: boolean) => void } & Omit<ComponentProps<typeof AccordionPrimitive.Root>, 'type' | 'collapsible' | 'value' | 'defaultValue' | 'onValueChange'>) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      className={cn('w-full rounded-lg border bg-card text-card-foreground', className)}
      value={open ? 'accordion-item' : onOpenChange ? '' : undefined}
      onValueChange={(value) => {
        onOpenChange?.(value === 'accordion-item')
      }}
      {...props}
    >
      <AccordionPrimitive.Item value="accordion-item">
        {children}
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  )
}
