import type { ComponentProps } from 'react'

import {
  Field as FieldPrimitive,
  FieldLabel as FieldLabelPrimitive,
} from '../field'
import { useFieldContext } from './context'

export const Field = (props: ComponentProps<typeof FieldPrimitive>) => {
  const field = useFieldContext()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return <FieldPrimitive data-invalid={isInvalid || undefined} {...props} />
}

export const FieldLabel = (
  props: ComponentProps<typeof FieldLabelPrimitive>
) => {
  const field = useFieldContext()

  return <FieldLabelPrimitive htmlFor={field.name} {...props} />
}
