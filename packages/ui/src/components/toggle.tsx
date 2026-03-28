import type { VariantProps } from 'class-variance-authority'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cn } from '@conar/ui/lib/utils'
import * as React from 'react'
import { toggleVariants } from './toggle.variants'

export function Toggle<T extends string>({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props<T>
  & VariantProps<typeof toggleVariants>): React.ReactElement {
  return (
    <TogglePrimitive
      className={cn(toggleVariants({ className, size, variant }))}
      data-slot="toggle"
      {...props}
    />
  )
}

export { TogglePrimitive }
