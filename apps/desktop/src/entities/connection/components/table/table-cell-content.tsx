import type { TableCellProps } from '@conar/table'
import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'

export function TableCellContent({
  className,
  children,
  value,
  position,
  ...props
}: Pick<TableCellProps, 'value' | 'position' | 'style'>
  & Pick<ComponentProps<'div'>, 'className' | 'children' | 'onMouseOver' | 'onMouseLeave'>) {
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
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
