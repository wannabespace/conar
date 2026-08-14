import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { alertVariants } from './alert.utils'

const Alert = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) => (
  <div
    data-slot="alert"
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
)

const AlertTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-title"
    className={cn(
      `[&_a]:hover:text-foreground font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3`,
      className
    )}
    {...props}
  />
)

const AlertDescription = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-description"
    className={cn(
      `text-muted-foreground [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4`,
      className
    )}
    {...props}
  />
)

const AlertAction = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="alert-action"
    className={cn('absolute top-2.5 right-3', className)}
    {...props}
  />
)

export { Alert, AlertAction, AlertDescription, AlertTitle }
