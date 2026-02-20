import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import { RiStackLine } from '@remixicon/react'
import { motion } from 'motion/react'

interface StickyHeaderProps extends ComponentProps<typeof motion.div> {
  activeSchemaId: string
  schemaParam: string | undefined
}

export function StickyHeader({ activeSchemaId, schemaParam, className, ...props }: StickyHeaderProps) {
  return (
    <motion.div
      key={activeSchemaId}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn('absolute inset-x-0 top-0 z-20 border-b border-border bg-background px-2 pt-2 pb-1', className)}
      {...props}
    >
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <RiStackLine
          className={cn(
            'size-4 shrink-0 text-muted-foreground opacity-50',
            schemaParam === activeSchemaId && 'text-primary opacity-100',
          )}
        />
        <span className="truncate text-sm font-medium">{activeSchemaId}</span>
      </div>
    </motion.div>
  )
}
