import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'

export function TableCellContent({
  className,
  children,
  value,
  ...props
}: ComponentProps<'div'> & { value: unknown }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 h-full text-xs truncate p-2 font-mono cursor-default select-none',
        'rounded-md transition-ring duration-100 ring-2 ring-inset ring-transparent',
        (value === null || value === '') && 'text-muted-foreground/50',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
