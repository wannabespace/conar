import type { TableCellProps } from '@conar/table'
import type { MutationObserverResult } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import type { Column } from './utils'
import { cn } from '@conar/ui/lib/utils'

export function TableCellContent({
  isPopoverOpen,
  isForeignOpen,
  isReferencesOpen,
  status,
  column,
  value,
  position,
  ...props
}: {
  isPopoverOpen: boolean
  isForeignOpen: boolean
  isReferencesOpen: boolean
  status: MutationObserverResult['status']
  column: Column
  value: unknown
  position: TableCellProps['position']
} & ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          flex h-full cursor-default items-center gap-1 truncate rounded-md p-2
          font-mono text-xs ring-2 ring-transparent select-none ring-inset
        `,
        (value === null || value === '') && 'text-muted-foreground/50',
        position === 'first' && 'pl-4',
        position === 'last' && 'pr-4',
        'flex justify-between ring-1',
        isPopoverOpen && 'bg-primary/10 ring-primary/30',
        (isForeignOpen || isReferencesOpen) && 'bg-accent/30 ring-accent/60',
        status === 'error' && 'bg-destructive/20 ring-destructive/50',
        status === 'success' && 'bg-success/10 ring-success/50',
        status === 'pending' && 'animate-pulse bg-primary/10',
        (column.foreign || (column.references?.length ?? 0) > 0) && 'pr-1!',
      )}
      {...props}
    />
  )
}
