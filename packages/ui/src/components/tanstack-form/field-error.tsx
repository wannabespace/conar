import { FieldError as FieldErrorPrimitive } from '../field'
import { useFieldContext } from './context'

export const FieldError = () => {
  const field = useFieldContext()

  if (!(field.state.meta.isTouched && !field.state.meta.isValid)) {
    return null
  }

  const errors = field.state.meta.errors.map((error) =>
    typeof error === 'string' ? { message: error } : error
  )

  return <FieldErrorPrimitive id={`${field.name}-error`} errors={errors} />
}
