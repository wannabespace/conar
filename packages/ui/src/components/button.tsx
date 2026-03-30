import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@conar/ui/lib/utils'
import { motion } from 'motion/react'
import { buttonVariants } from './button.variants'

export interface ButtonProps extends useRender.ComponentProps<'button'> {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
}

export const ButtonMotion = motion.create(Button)

export function Button({
  className,
  variant,
  size,
  render,
  ...props
}: ButtonProps): React.ReactElement {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
    = render ? undefined : 'button'

  const defaultProps = {
    'className': cn(buttonVariants({ className, size, variant })),
    'data-slot': 'button',
    'type': typeValue,
  }

  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(defaultProps, props),
    render,
  })
}
