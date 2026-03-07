import type { ComponentProps } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@conar/ui/components/accordion'
import { cn } from '@conar/ui/lib/utils'
import { RiStackLine } from '@remixicon/react'
import { motion } from 'motion/react'

interface StickyHeaderProps extends ComponentProps<typeof motion.div> {
  activeSchemaId: string
  schemaParam: string | undefined
  isExpanded: boolean
  onToggle: VoidFunction
  canToggle: boolean
}

const triggerContentClassName = 'flex min-w-0 flex-1 items-center gap-2'

export function StickyHeader({
  activeSchemaId,
  schemaParam,
  isExpanded,
  onToggle,
  canToggle,
  className,
  ...props
}: StickyHeaderProps) {
  const label = (
    <>
      <RiStackLine
        className={cn(
          'size-4 shrink-0 text-muted-foreground opacity-50',
          schemaParam === activeSchemaId && 'text-primary opacity-100',
        )}
      />
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{activeSchemaId}</span>
    </>
  )

  return (
    <motion.div
      key={activeSchemaId}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(`
        absolute inset-x-0 top-0 z-20 border-b border-border bg-background px-2
        pt-2 pb-1
      `, className)}
      {...props}
    >
      {canToggle
        ? (
            <Accordion
              type="multiple"
              value={isExpanded ? [activeSchemaId] : []}
              onValueChange={onToggle}
              className="w-full"
            >
              <AccordionItem value={activeSchemaId} className="border-b-0">
                <AccordionTrigger
                  className={cn(
                    `
                      items-center px-2 py-1.5
                      hover:no-underline
                      [&[data-state=open]>svg]:rotate-180
                    `,
                  )}
                >
                  <span className={triggerContentClassName}>{label}</span>
                </AccordionTrigger>
                <AccordionContent className="hidden p-0" />
              </AccordionItem>
            </Accordion>
          )
        : (
            <div className={cn(`
              flex w-full items-center gap-2 rounded-md px-2 py-1.5
            `, triggerContentClassName)}
            >
              {label}
            </div>
          )}
    </motion.div>
  )
}
