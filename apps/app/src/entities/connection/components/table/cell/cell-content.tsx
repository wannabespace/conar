import type { TableCellProps } from '@conar/table'
import type { ComponentProps } from 'react'
import type { Column } from './utils'
import { cn } from '@conar/ui/lib/utils'

export function TableCellContent({
  className,
  column,
  value,
  position,
  ...props
}: {
  column: Column
  value: unknown
  position: TableCellProps['position']
} & ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          flex h-full cursor-default items-center justify-between gap-1 truncate
          rounded-md p-2 font-mono text-xs ring-1 ring-transparent outline-none
          select-none
        `,
        (value === null || value === '') && 'text-muted-foreground/50',
        position === 'first' && 'pl-4',
        position === 'last' && 'pr-4',
        className,
      )}
      {...props}
    />
  )
}
