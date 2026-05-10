import type * as React from 'react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { cn } from '@conar/ui/lib/utils'

export function Field({
  className,
  ...props
}: FieldPrimitive.Root.Props): React.ReactElement {
  return (
    <FieldPrimitive.Root
      className={cn('flex flex-col items-start gap-2', className)}
      data-slot="field"
      {...props}
    />
  )
}

export function FieldLabel({
  className,
  ...props
}: FieldPrimitive.Label.Props): React.ReactElement {
  return (
    <FieldPrimitive.Label
      className={cn(
        `
          inline-flex items-center gap-2 text-base/4.5 font-medium
          text-foreground
          data-disabled:opacity-64
          sm:text-sm/4
        `,
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  )
}

export function FieldItem({
  className,
  ...props
}: FieldPrimitive.Item.Props): React.ReactElement {
  return (
    <FieldPrimitive.Item
      className={cn('flex', className)}
      data-slot="field-item"
      {...props}
    />
  )
}

export function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props): React.ReactElement {
  return (
    <FieldPrimitive.Description
      className={cn('text-xs text-muted-foreground', className)}
      data-slot="field-description"
      {...props}
    />
  )
}

export function FieldError({
  className,
  ...props
}: FieldPrimitive.Error.Props): React.ReactElement {
  return (
    <FieldPrimitive.Error
      className={cn('text-xs text-destructive-foreground', className)}
      data-slot="field-error"
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const FieldControl: typeof FieldPrimitive.Control
  = FieldPrimitive.Control
// eslint-disable-next-line react-refresh/only-export-components
export const FieldValidity: typeof FieldPrimitive.Validity
  = FieldPrimitive.Validity
