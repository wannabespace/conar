import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function TypographyH3({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        `scroll-m-20 text-2xl font-semibold tracking-tight`,
        className,
      )}
      {...props}
    />
  )
}
