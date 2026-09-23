import type { ComponentProps } from 'react'

import {
  Field as FieldPrimitive,
  FieldInvalidProvider,
  FieldLabel as FieldLabelPrimitive,
} from '../field'
import { isFieldInvalid, useFieldContext } from './context'
import { FieldError } from './field-error'

export const Field = (props: ComponentProps<typeof FieldPrimitive>) => {
  const field = useFieldContext()
  const isInvalid = isFieldInvalid(field)

  return (
    <FieldInvalidProvider value={isInvalid ? <FieldError /> : null}>
      <FieldPrimitive data-invalid={isInvalid || undefined} {...props} />
    </FieldInvalidProvider>
  )
}

export const FieldLabel = ({
  children,
  ...props
}: ComponentProps<typeof FieldLabelPrimitive>) => {
  const field = useFieldContext()

  return (
    <FieldLabelPrimitive htmlFor={field.name} {...props}>
      {children}
      <FieldError className="group-has-[[data-slot=combobox-chips]]/field:hidden group-has-[[data-slot=input-group]]/field:hidden group-has-[[data-slot=select-trigger]]/field:hidden" />
    </FieldLabelPrimitive>
  )
}
