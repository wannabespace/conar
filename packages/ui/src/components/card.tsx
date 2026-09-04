import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

const Card = ({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) => (
  <div
    data-slot="card"
    data-size={size}
    className={cn(
      `group/card bg-card text-card-foreground ring-foreground/4 flex flex-col gap-(--card-spacing) overflow-hidden rounded-[min(var(--radius-4xl),24px)] py-(--card-spacing) text-sm shadow-sm ring-[0.5px] [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-[min(var(--radius-4xl),24px)] *:[img:last-child]:rounded-b-[min(var(--radius-4xl),24px)]`,
      className
    )}
    {...props}
  />
)

const CardHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="card-header"
    className={cn(
      `group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-[min(var(--radius-4xl),24px)] px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)`,
      className
    )}
    {...props}
  />
)

const CardTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="card-title"
    className={cn('font-heading text-base font-medium', className)}
    {...props}
  />
)

const CardDescription = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    data-slot="card-description"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
)

const CardAction = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="card-action"
    className={cn(
      'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
      className
    )}
    {...props}
  />
)

const CardContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="card-content"
    className={cn('px-(--card-spacing)', className)}
    {...props}
  />
)

const CardFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="card-footer"
    className={cn(
      `flex items-center rounded-b-[min(var(--radius-4xl),24px)] px-(--card-spacing) [.border-t]:pt-(--card-spacing)`,
      className
    )}
    {...props}
  />
)

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
}
