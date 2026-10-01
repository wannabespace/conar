import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

export const ScrollArea = ({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'div'> & { variant?: 'default' | 'code' }) => (
  <div
    className={cn(
      // oxlint-disable-next-line tailwindcss/no-conflicting-classes
      `scrollbar-thumb-foreground/15 scrollbar-thin scrollbar-track-transparent overflow-auto`,
      variant === 'code' &&
        'bg-muted text-muted-foreground rounded-md p-4 font-mono text-xs',
      className
    )}
    {...props}
  />
)
