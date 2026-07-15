import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

export function ScrollArea({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // oxlint-disable-next-line tailwindcss/no-conflicting-classes -- scrollbar-track-* only sets the --scrollbar-track variable that scrollbar-thin reads
        `scrollbar-thin scrollbar-thumb-black/15 scrollbar-track-transparent overflow-auto dark:scrollbar-thumb-white/15`,
        className,
      )}
      {...props}
    />
  )
}
