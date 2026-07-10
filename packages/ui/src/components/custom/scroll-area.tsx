import { cn } from '@conar/ui/lib/utils'
import type { ComponentProps } from 'react'

export function ScrollArea({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(`scrollbar-thin scrollbar-thumb-black/15 scrollbar-track-transparent overflow-auto dark:scrollbar-thumb-white/15`, className)}
      {...props}
    />
  )
}
