import { cn } from '@conar/ui/lib/utils'

export function Indicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(`absolute -top-1 -right-1 size-2 rounded-full bg-primary`, className)}
      {...props}
    />
  )
}
