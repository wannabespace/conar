import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground', className)} {...props} />
  )
}
Card.displayName = 'Card'

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}
CardHeader.displayName = 'CardHeader'

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('font-semibold tracking-tight', className)} {...props} />
}
CardTitle.displayName = 'CardTitle'

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm text-balance text-muted-foreground', className)} {...props} />
}
CardDescription.displayName = 'CardDescription'

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}
CardContent.displayName = 'CardContent'

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
