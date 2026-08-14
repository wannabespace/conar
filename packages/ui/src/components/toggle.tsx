import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { toggleVariants } from './toggle.utils'

const Toggle = ({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) => (
  <TogglePrimitive
    data-slot="toggle"
    className={cn(toggleVariants({ className, size, variant }))}
    {...props}
  />
)

export { Toggle }
