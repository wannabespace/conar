import type { ComponentProps } from 'react'

import { cn } from '../../lib/utils'

export const TypographyH4 = ({
  className,
  children,
  ...props
}: ComponentProps<'h4'>) => (
  <h4
    className={cn(
      `scroll-m-20 text-xl font-semibold tracking-tight`,
      className
    )}
    {...props}
  >
    {children}
  </h4>
)
