import { cn } from '@tamery/ui/lib/utils'

export const Indicator = ({
  className,
  inverse = false,
  ...props
}: React.ComponentProps<'span'> & { inverse?: boolean }) => (
  <span
    className={cn(
      `bg-primary absolute -top-1 -right-1 size-2 rounded-full`,
      inverse && 'bg-primary-foreground',
      className
    )}
    {...props}
  />
)
