import type { VariantProps } from 'class-variance-authority'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'
import { bubbleReactionsVariants, bubbleVariants } from './bubble.utils'

function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bubble-group"
      className={cn('flex min-w-0 flex-col gap-2', className)}
      {...props}
    />
  )
}

function Bubble({
  variant = 'default',
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'div'>
  & VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end'
  }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  )
}

function BubbleContent({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          `
            w-fit max-w-full min-w-0 overflow-hidden rounded-3xl border
            border-transparent px-3 py-2.5 text-sm/relaxed wrap-break-word
            group-data-[align=end]/bubble:self-end
            [button]:text-left
            [button,a]:transition-colors [button,a]:outline-none
            [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3
            [button,a]:focus-visible:ring-ring/30
          `,
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'bubble-content',
    },
  })
}

function BubbleReactions({
  side = 'bottom',
  align = 'end',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  )
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions }
