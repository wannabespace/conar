import { cn } from '@tamery/ui/lib/utils'

const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('bg-muted animate-pulse rounded-2xl', className)}
    {...props}
  />
)

export { Skeleton }
