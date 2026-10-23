import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '@tamery/ui/lib/utils'

/** `value={null}` sweeps a segment along the track for work that cannot say how far it is. */
const Progress = ({
  className,
  variant = 'default',
  ...props
}: ProgressPrimitive.Root.Props & { variant?: 'default' | 'destructive' }) => (
  <ProgressPrimitive.Root
    data-slot="progress"
    className={cn('w-full', className)}
    {...props}
  >
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className="bg-foreground/8 relative h-0.75 overflow-hidden rounded-full"
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'ease-house data-indeterminate:animate-progress-sweep h-full rounded-full transition-[width] duration-450 data-indeterminate:w-[28%] motion-reduce:animate-none',
          variant === 'destructive' ? 'bg-destructive' : 'bg-foreground/75'
        )}
      />
    </ProgressPrimitive.Track>
  </ProgressPrimitive.Root>
)

export { Progress }
