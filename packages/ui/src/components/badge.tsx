import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@conar/ui/lib/utils'
import { badgeVariants } from './badge.variants'

export interface BadgeProps extends useRender.ComponentProps<'span'> {
  variant?: VariantProps<typeof badgeVariants>['variant']
  size?: VariantProps<typeof badgeVariants>['size']
}

export function Badge({
  className,
  variant,
  size,
  render,
  ...props
}: BadgeProps): React.ReactElement {
  const defaultProps = {
    'className': cn(badgeVariants({ className, size, variant })),
    'data-slot': 'badge',
  }

  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(defaultProps, props),
    render,
  })
}
