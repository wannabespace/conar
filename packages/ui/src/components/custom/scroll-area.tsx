import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'

export function ScrollArea({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        `
          scrollbar-thin overflow-auto scrollbar-thumb-black/15
          scrollbar-track-transparent
          dark:scrollbar-thumb-white/15
        `,
        className,
      )}
      {...props}
    />
  )
}
