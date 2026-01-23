import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@conar/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { buttonVariants } from './button.variants'

export function Button({
  className,
  variant,
  size,
  type = 'button',
  asChild = false,
  ...props
}: React.ComponentProps<'button'>
  & VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
