import type { ComponentProps } from 'react'

import { useFieldContext } from '.'
import { Field as FieldPrimitive, FieldLabel as FieldLabelPrimitive } from '../field'

export function Field(props: ComponentProps<typeof FieldPrimitive>) {
  const field = useFieldContext()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return <FieldPrimitive data-invalid={isInvalid || undefined} {...props} />
}

export function FieldLabel(props: ComponentProps<typeof FieldLabelPrimitive>) {
  const field = useFieldContext()

  return <FieldLabelPrimitive htmlFor={field.name} {...props} />
}
