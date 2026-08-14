import { createFormHook } from '@tanstack/react-form'

import { fieldContext, formContext } from './context'
import { Field, FieldLabel } from './field'
import { FieldError } from './field-error'
import { FieldInput } from './field-input'
import { FieldPasswordInput } from './field-password-input'

export type { FormInputProps } from './context'
export {
  fieldContext,
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
  },
  fieldContext,
  formComponents: {},
  formContext,
})
