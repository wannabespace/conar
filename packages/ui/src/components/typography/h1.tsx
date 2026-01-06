import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function TypographyH1({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        `
          scroll-m-20 text-center text-4xl font-extrabold tracking-tight
          text-balance
        `,
        className,
      )}
      {...props}
    />
  )
}
