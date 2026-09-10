import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

// Steppers sit on the group's own fill, so they hover by foreground-mix like
// every other filled control rather than with the accent tint
const stepperClassName = `text-muted-foreground hover:text-foreground relative flex h-full shrink-0 items-center justify-center px-2.5 transition-colors hover:bg-[color-mix(in_oklch,var(--input),var(--foreground)_3%)] in-data-[size=sm]:px-2 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11`

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
      `bg-input ring-foreground/4 text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/30 focus-within:focus-ring relative flex h-8 w-full items-center justify-between overflow-hidden rounded-xl border border-transparent text-sm shadow-xs ring-[0.5px] transition-shadow duration-200 outline-none in-data-[size=lg]:h-9 in-data-[size=sm]:h-7 in-data-[size=sm]:rounded-lg has-aria-invalid:ring-3 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
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
    className={cn(stepperClassName, className)}
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
    className={cn(stepperClassName, className)}
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
      `h-full w-full min-w-0 grow bg-transparent px-1 text-center tabular-nums outline-none [transition:background-color_5000000s_ease-in-out_0s]`,
      className
    )}
    data-slot="number-field-input"
    {...props}
  />
)
