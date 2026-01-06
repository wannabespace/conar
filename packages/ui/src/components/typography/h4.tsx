import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function TypographyH4({ className, ...props }: ComponentProps<'h4'>) {
  return (
    <h4
      className={cn(
        `scroll-m-20 text-xl font-semibold tracking-tight`,
        className,
      )}
      {...props}
    />
  )
}
