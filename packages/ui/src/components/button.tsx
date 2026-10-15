import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'

import { buttonVariants } from './button.utils'

const Button = ({
  className,
  variant = 'default',
  size = 'default',
  render,
  nativeButton = !render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot="button"
    className={cn(buttonVariants({ className, size, variant }))}
    render={render}
    nativeButton={nativeButton}
    {...props}
  />
)

export { Button }
