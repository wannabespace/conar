import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

export const ScrollArea = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      // oxlint-disable-next-line tailwindcss/no-conflicting-classes
      `scrollbar-thumb-foreground/15 scrollbar-thin scrollbar-track-transparent overflow-auto`,
      className
    )}
    {...props}
  />
)
