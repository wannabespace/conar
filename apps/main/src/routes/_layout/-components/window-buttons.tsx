import { cn } from '@tamery/ui/lib/utils'

const COLORS = ['bg-destructive', 'bg-warning', 'bg-success']

export const WindowButtons = ({
  className,
  muted,
}: {
  className?: string
  muted?: boolean
}) => (
  <div className={cn('flex shrink-0 gap-2', className)}>
    {COLORS.map((color) => (
      <span
        key={color}
        className={cn(
          'size-3 rounded-full',
          muted ? 'bg-foreground/12' : color
        )}
      />
    ))}
  </div>
)
