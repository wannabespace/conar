import { useFieldContext } from '.'
import { FieldError as FieldErrorPrimitive } from '../field'

export function FieldError() {
  const field = useFieldContext()

  if (!(field.state.meta.isTouched && !field.state.meta.isValid)) {
    return null
  }

  return (
    <FieldErrorPrimitive>
      {field.state.meta.errors
        .map(error =>
          typeof error === 'string' ? error : typeof error === 'object' ? error?.message : error,
        )
        .filter(Boolean)
        .join(', ')}
    </FieldErrorPrimitive>
  )
}
