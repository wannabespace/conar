import type { ComponentProps } from 'react'

import { cn } from '../../lib/utils'

export const TypographyP = ({ className, ...props }: ComponentProps<'p'>) => (
  <p className={cn(`leading-7 not-first:mt-6`, className)} {...props} />
)
