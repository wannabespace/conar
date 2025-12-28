import type { ComponentProps } from 'react'
import type { TableCellProps } from '~/components/table'
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
          flex h-full cursor-default items-center gap-1 truncate p-2 font-mono
          text-xs select-none
        `,
        `
          transition-ring rounded-md ring-2 ring-transparent duration-100
          ring-inset
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
