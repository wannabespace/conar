import { createFormHook } from '@tanstack/react-form'

import { fieldContext, formContext } from './context'
import { Field, FieldLabel } from './field'
import { FieldError } from './field-error'
import { FieldInput } from './field-input'
import { FieldPasswordInput } from './field-password-input'
import { FieldTextarea } from './field-textarea'

export { Form } from './form'
export type { FormInputProps } from './context'
export {
  fieldContext,
  fieldErrorMessage,
  formContext,
  formInputProps,
  useFieldContext,
  useFormContext,
} from './context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Error: FieldError,
    Field,
    Input: FieldInput,
    Label: FieldLabel,
    PasswordInput: FieldPasswordInput,
    Textarea: FieldTextarea,
  },
  fieldContext,
  formComponents: {},
  formContext,
})
