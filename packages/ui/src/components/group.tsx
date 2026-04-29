import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { Separator } from '@conar/ui/components/separator'
import { cn } from '@conar/ui/lib/utils'
import { groupVariants } from './group.variants'

export function Group({
  className,
  orientation,
  children,
  ...props
}: {
  className?: string
  orientation?: VariantProps<typeof groupVariants>['orientation']
  children: React.ReactNode
} & React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn(groupVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="group"
      role="group"
      {...props}
    >
      {children}
    </div>
  )
}

export function GroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  const defaultProps = {
    'className': cn(
      `
        relative inline-flex items-center gap-2 rounded-lg border border-input
        bg-muted px-[calc(--spacing(3)-1px)] text-base whitespace-nowrap
        text-muted-foreground shadow-xs/5 transition-shadow outline-none
        not-dark:bg-clip-padding
        before:pointer-events-none before:absolute before:inset-0
        before:rounded-[calc(var(--radius-lg)-1px)]
        before:shadow-[0_1px_--theme(--color-black/6%)]
        sm:text-sm
        dark:bg-input/64
        dark:before:shadow-[0_-1px_--theme(--color-white/6%)]
        [&_svg]:-mx-0.5 [&_svg]:shrink-0
        [&_svg:not([class*='size-'])]:size-4.5
        sm:[&_svg:not([class*='size-'])]:size-4
      `,
      className,
    ),
    'data-slot': 'group-text',
  }
  return useRender({
    defaultTagName: 'div',
    props: mergeProps(defaultProps, props),
    render,
  })
}

export function GroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: {
  className?: string
} & React.ComponentProps<typeof Separator>): React.ReactElement {
  return (
    <Separator
      className={cn(
        `
          pointer-events-none relative z-2 bg-input
          before:absolute before:inset-0
          has-[+[data-slot=input-control]:focus-within,+[data-slot=input-group]:focus-within,+[data-slot=select-trigger]:focus-visible+*,+[data-slot=number-field]:focus-within]:translate-x-px
          has-[+[data-slot=input-control]:focus-within,+[data-slot=input-group]:focus-within,+[data-slot=select-trigger]:focus-visible+*,+[data-slot=number-field]:focus-within]:bg-ring
          dark:before:bg-input/32
          [[data-slot=input-control]:focus-within+&,[data-slot=input-group]:focus-within+&,[data-slot=select-trigger]:focus-visible+*+&,[data-slot=number-field]:focus-within+&,[data-slot=number-field]:focus-within+input+&]:bg-ring
          [[data-slot=input-control]:focus-within+&,[data-slot=input-group]:focus-within+&,[data-slot=select-trigger]:focus-visible+*+&,[data-slot=number-field]:focus-within+input+&]:-translate-x-px
        `,
        className,
      )}
      orientation={orientation}
      {...props}
    />
  )
}

export {
  Group as ButtonGroup,
  GroupSeparator as ButtonGroupSeparator,
  GroupText as ButtonGroupText,
}
