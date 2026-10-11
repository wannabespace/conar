import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps } from 'react'

export const Reveal = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn(
      'animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-600 ease-[cubic-bezier(0.32,0.72,0,1)] [animation-range:entry_10%_entry_90%] [animation-timeline:view()] motion-reduce:animate-none',
      className
    )}
    {...props}
  />
)
