import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type * as React from 'react'

const Empty = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty"
    className={cn(
      `flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12`,
      className
    )}
    {...props}
  />
)

const EmptyHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty-header"
    className={cn(
      'flex max-w-sm flex-col items-center gap-2 text-center',
      className
    )}
    {...props}
  />
)

const emptyMediaVariants = cva(
  `mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: `bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6`,
      },
    },
  }
)

const EmptyMedia = ({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) => (
  <div
    data-slot="empty-icon"
    data-variant={variant}
    className={cn(emptyMediaVariants({ className, variant }))}
    {...props}
  />
)

const EmptyTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty-title"
    className={cn('text-lg font-medium tracking-tight', className)}
    {...props}
  />
)

const EmptyDescription = ({
  className,
  ...props
}: React.ComponentProps<'p'>) => (
  <div
    data-slot="empty-description"
    className={cn(
      `text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4`,
      className
    )}
    {...props}
  />
)

const EmptyContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="empty-content"
    className={cn(
      `flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance`,
      className
    )}
    {...props}
  />
)

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
