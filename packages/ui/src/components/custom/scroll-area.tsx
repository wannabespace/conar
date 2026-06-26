import type { ComponentProps } from 'react'
import { cn } from '@tamery/ui/lib/utils'

export function ScrollArea({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          scrollbar-thin scrollbar-thumb-black/15 scrollbar-track-transparent
          overflow-auto
          dark:scrollbar-thumb-white/15
        `,
        className,
      )}
      {...props}
    />
  )
}
