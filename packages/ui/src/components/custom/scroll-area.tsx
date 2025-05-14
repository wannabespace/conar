import type { ComponentProps } from 'react'
import { cn } from '@connnect/ui/lib/utils'

export function ScrollArea({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/15 dark:scrollbar-thumb-white/15',
        className,
      )}
      {...props}
    />
  )
}
