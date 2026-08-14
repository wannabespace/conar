import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { markerVariants } from './marker.utils'

const Marker = ({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof markerVariants>) =>
  useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(markerVariants({ className, variant })),
      },
      props
    ),
    render,
    state: {
      slot: 'marker',
      variant,
    },
  })

const MarkerIcon = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    data-slot="marker-icon"
    aria-hidden="true"
    className={cn(
      `size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4`,
      className
    )}
    {...props}
  />
)

const MarkerContent = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    data-slot="marker-content"
    className={cn(
      `*:[a]:hover:text-foreground min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3`,
      className
    )}
    {...props}
  />
)

export { Marker, MarkerContent, MarkerIcon }
