import { useFieldContext } from '.'
import { FieldError as FieldErrorPrimitive } from '../field'

export function FieldError() {
  const field = useFieldContext()

  return (
    <FieldErrorPrimitive match={field.state.meta.isTouched && !field.state.meta.isValid}>
      {field.state.meta.errors
        .map((error) =>
          typeof error === 'string' ? error : typeof error === 'object' ? error?.message : error,
        )
        .filter(Boolean)
        .join(', ')}
    </FieldErrorPrimitive>
  )
}
