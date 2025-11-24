import type { ComponentProps } from 'react'
import type { TableCellProps } from '~/components/table'
import { cn } from '@conar/ui/lib/utils'

export function TableCellContent({
  className,
  children,
  cell,
  ...props
}: ComponentProps<'div'> & { cell: Pick<TableCellProps, 'value' | 'position'> }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 h-full text-xs truncate p-2 font-mono cursor-default select-none',
        'rounded-md transition-ring duration-100 ring-2 ring-inset ring-transparent',
        (cell.value === null || cell.value === '') && 'text-muted-foreground/50',
        cell.position === 'first' && 'pl-4',
        cell.position === 'last' && 'pr-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
