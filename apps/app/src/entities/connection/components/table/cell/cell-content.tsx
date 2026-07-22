import type { TableCellProps } from '@tamery/table'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

import type { Column } from './utils'

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
      data-mask
      className={cn(
        `
          flex h-full cursor-default items-center justify-between gap-1 truncate
          rounded-md p-2 font-mono text-xs inset-ring inset-ring-transparent outline-none
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
