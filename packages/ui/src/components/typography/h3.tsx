import type { ComponentProps } from 'react'

import { cn } from '../../lib/utils'

export const TypographyH3 = ({
  className,
  children,
  ...props
}: ComponentProps<'h3'>) => (
  <h3
    className={cn(
      `scroll-m-20 text-2xl font-semibold tracking-tight`,
      className
    )}
    {...props}
  >
    {children}
  </h3>
)
