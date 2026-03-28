import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'

export function Kbd({
  className,
  ...props
}: React.ComponentProps<'kbd'>): React.ReactElement {
  return (
    <kbd
      className={cn(
        `
          pointer-events-none inline-flex h-5 min-w-5 items-center
          justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs
          font-medium text-muted-foreground select-none
          [&_svg:not([class*='size-'])]:size-3
        `,
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  )
}

export function KbdGroup({
  className,
  ...props
}: React.ComponentProps<'kbd'>): React.ReactElement {
  return (
    <kbd
      className={cn('inline-flex items-center gap-1', className)}
      data-slot="kbd-group"
      {...props}
    />
  )
}
