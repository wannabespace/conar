import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function TypographyP({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        `
          leading-7
          not-first:mt-6
        `,
        className,
      )}
      {...props}
    />
  )
}
