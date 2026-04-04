import type { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from './toggle.variants'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { Separator } from '@conar/ui/components/separator'
import {
  Toggle as ToggleComponent,
} from '@conar/ui/components/toggle'
import { cn } from '@conar/ui/lib/utils'
import * as React from 'react'

const ToggleGroupContext: React.Context<
  VariantProps<typeof toggleVariants>
> = React.createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
})

export function ToggleGroup<T extends string>({
  className,
  variant = 'default',
  size = 'default',
  orientation = 'horizontal',
  children,
  ...props
}: ToggleGroupPrimitive.Props<T> & VariantProps<typeof toggleVariants>): React.ReactElement {
  return (
    <ToggleGroupPrimitive
      className={cn(
        `
          flex w-fit
          *:focus-visible:z-10
          dark:*:[[data-slot=separator]:has(+[data-slot=toggle]:hover)]:before:bg-input/64
          dark:*:[[data-slot=separator]:has(+[data-slot=toggle][data-pressed])]:before:bg-input
          dark:*:[[data-slot=toggle]:hover+[data-slot=separator]]:before:bg-input/64
          dark:*:[[data-slot=toggle][data-pressed]+[data-slot=separator]]:before:bg-input
        `,
        orientation === 'horizontal'
          ? '*:pointer-coarse:after:min-w-auto'
          : '*:pointer-coarse:after:min-h-auto',
        variant === 'default'
          ? 'gap-0.5'
          : orientation === 'horizontal'
            ? `
              *:not-first:rounded-s-none *:not-first:border-s-0
              *:not-last:rounded-e-none *:not-last:border-e-0
              *:not-first:before:rounded-s-none
              *:not-last:before:rounded-e-none
              *:not-first:not-data-[slot=separator]:before:-inset-s-[0.5px]
              *:not-last:not-data-[slot=separator]:before:-inset-e-[0.5px]
            `
            : `
              flex-col
              *:not-first:rounded-t-none *:not-first:border-t-0
              *:not-last:rounded-b-none *:not-last:border-b-0
              *:not-first:before:rounded-t-none
              *:not-last:before:rounded-b-none
              *:not-first:not-data-[slot=separator]:before:-top-[0.5px]
              *:not-last:not-data-[slot=separator]:before:-bottom-[0.5px]
              *:data-[slot=toggle]:not-last:before:hidden
              dark:*:first:before:block
              dark:*:last:before:hidden
            `,
        className,
      )}
      data-size={size}
      data-slot="toggle-group"
      data-variant={variant}
      orientation={orientation}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ size, variant }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

export function Toggle<T extends string>({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props<T>
  & VariantProps<typeof toggleVariants>): React.ReactElement {
  const context = React.use(ToggleGroupContext)

  const resolvedVariant = context.variant || variant
  const resolvedSize = context.size || size

  return (
    <ToggleComponent
      className={className}
      data-size={resolvedSize}
      data-variant={resolvedVariant}
      size={resolvedSize}
      variant={resolvedVariant}
      {...props}
    >
      {children}
    </ToggleComponent>
  )
}

export function ToggleGroupSeparator({
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
          pointer-events-none relative bg-input
          before:absolute before:inset-0
          dark:before:bg-input/32
        `,
        className,
      )}
      orientation={orientation}
      {...props}
    />
  )
}

export { Toggle as ToggleGroupItem }
