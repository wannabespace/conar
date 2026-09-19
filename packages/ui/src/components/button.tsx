import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { buttonVariants } from './button.utils'

const Button = ({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot="button"
    className={cn(buttonVariants({ className, size, variant }))}
    {...props}
  />
)

export { Button }
