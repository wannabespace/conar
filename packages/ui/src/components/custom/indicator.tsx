import { cn } from '@conar/ui/lib/utils'

export function Indicator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('size-2 absolute -top-0.5 -right-0.5 bg-primary rounded-full', className)} {...props} />
}
