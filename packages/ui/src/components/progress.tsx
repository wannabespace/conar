import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { progressIndicatorVariants } from './progress.utils'

const Progress = ({
  className,
  variant,
  ...props
}: ProgressPrimitive.Root.Props &
  VariantProps<typeof progressIndicatorVariants>) => (
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
        className={progressIndicatorVariants({ variant })}
      />
    </ProgressPrimitive.Track>
  </ProgressPrimitive.Root>
)

export { Progress }
