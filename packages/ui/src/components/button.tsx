import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import { isValidElement } from 'react'

import { buttonVariants } from './button.utils'

const Button = ({
  className,
  render,
  variant = 'default',
  size = 'default',
  tone = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot="button"
    className={cn(buttonVariants({ className, size, tone, variant }))}
    nativeButton={
      !render || (isValidElement(render) && render.type === 'button')
    }
    render={render}
    {...props}
  />
)

export { Button }
