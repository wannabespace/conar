import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

export function ScrollArea({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // oxlint-disable-next-line tailwindcss/no-conflicting-classes
        `
          scrollbar-thin scrollbar-thumb-foreground/15 scrollbar-track-transparent
          overflow-auto
        `,
        className,
      )}
      {...props}
    />
  )
}
