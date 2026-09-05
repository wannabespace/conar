import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

export const NumberField = ({
  id,
  className,
  size = 'default',
  ...props
}: NumberFieldPrimitive.Root.Props & {
  size?: 'sm' | 'default' | 'lg'
}): React.ReactElement => {
  const generatedId = React.useId()

  return (
    <NumberFieldPrimitive.Root
      className={cn('flex w-full flex-col items-start gap-2', className)}
      data-size={size}
      data-slot="number-field"
      id={id ?? generatedId}
      {...props}
    />
  )
}

export const NumberFieldGroup = ({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props): React.ReactElement => (
  <NumberFieldPrimitive.Group
    className={cn(
      `border-input bg-input/32 text-foreground ring-ring/24 focus-within:border-ring has-autofill:bg-foreground/5 has-aria-invalid:border-destructive/36 has-aria-invalid:ring-destructive/15 focus-within:has-aria-invalid:border-destructive/64 focus-within:has-aria-invalid:ring-destructive/48 relative flex w-full justify-between rounded-lg border bg-clip-padding text-base shadow-xs/5 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-within:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%),0_-1px_--theme(--color-white/6%)] focus-within:ring-[0.1875rem] data-disabled:pointer-events-none data-disabled:opacity-64 sm:text-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [[data-disabled],:focus-within,[aria-invalid]]:shadow-none`,
      className
    )}
    data-slot="number-field-group"
    {...props}
  />
)

export const NumberFieldDecrement = ({
  className,
  ...props
}: NumberFieldPrimitive.Decrement.Props): React.ReactElement => (
  <NumberFieldPrimitive.Decrement
    className={cn(
      `hover:bg-accent relative flex shrink-0 items-center justify-center rounded-s-[calc(var(--radius-lg)-1px)] px-[calc(--spacing(3)-1px)] transition-colors in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11`,
      className
    )}
    data-slot="number-field-decrement"
    {...props}
  >
    <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
  </NumberFieldPrimitive.Decrement>
)

export const NumberFieldIncrement = ({
  className,
  ...props
}: NumberFieldPrimitive.Increment.Props): React.ReactElement => (
  <NumberFieldPrimitive.Increment
    className={cn(
      `hover:bg-accent relative flex shrink-0 items-center justify-center rounded-e-[calc(var(--radius-lg)-1px)] px-[calc(--spacing(3)-1px)] transition-colors in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11`,
      className
    )}
    data-slot="number-field-increment"
    {...props}
  >
    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
  </NumberFieldPrimitive.Increment>
)

export const NumberFieldInput = ({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props): React.ReactElement => (
  <NumberFieldPrimitive.Input
    className={cn(
      `h-8.5 w-full min-w-0 grow bg-transparent px-[calc(--spacing(3)-1px)] text-center leading-8.5 tabular-nums outline-none [transition:background-color_5000000s_ease-in-out_0s] in-data-[size=lg]:h-9.5 in-data-[size=lg]:leading-9.5 in-data-[size=sm]:h-7.5 in-data-[size=sm]:px-[calc(--spacing(2.5)-1px)] in-data-[size=sm]:leading-7.5 sm:h-7.5 sm:leading-7.5 sm:in-data-[size=lg]:h-8.5 sm:in-data-[size=lg]:leading-8.5 sm:in-data-[size=sm]:h-6.5 sm:in-data-[size=sm]:leading-8.5`,
      className
    )}
    data-slot="number-field-input"
    {...props}
  />
)
