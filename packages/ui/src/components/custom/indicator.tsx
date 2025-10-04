import { cn } from '@conar/ui/lib/utils'

export function Indicator({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('size-2 absolute -top-1 -right-1 bg-primary rounded-full', className)} {...props} />
}
