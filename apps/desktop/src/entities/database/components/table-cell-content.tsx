import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'

export function TableCellContent({
  className,
  children,
  position,
  value,
  ...props
}: ComponentProps<'div'> & { position: 'first' | 'last' | 'middle', value: unknown }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 h-full text-xs truncate p-2 font-mono cursor-default select-none',
        'rounded-md transition-ring duration-100 ring-2 ring-inset ring-transparent',
        position === 'first' && 'pl-4',
        position === 'last' && 'pr-4',
        (value === null || value === '') && 'text-muted-foreground/50',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
