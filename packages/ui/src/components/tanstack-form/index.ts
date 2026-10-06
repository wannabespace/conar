import type { AnyFormApi } from '@tanstack/react-form'
import { createFormHook } from '@tanstack/react-form'

import { fieldContext, formContext } from './context'
import { Field, FieldLabel } from './field'
import { FieldError } from './field-error'
import { FieldInput } from './field-input'
import { FieldPasswordInput } from './field-password-input'
import { FieldTextarea } from './field-textarea'

export { Form } from './form'
export { Field, FieldLabel } from './field'
export { FieldInput } from './field-input'
export { FieldTextarea } from './field-textarea'
export type { FormInputProps } from './context'
export {
  fieldContext,
  fieldErrorMessage,
  formContext,
  formInputProps,
  useFieldContext,
  useFormContext,
} from './context'

const { useAppForm: useKitForm } = createFormHook({
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

const revealErrors = (form: AnyFormApi) => {
  for (const name of Object.keys(form.state.fieldMeta)) {
    form.setFieldMeta(name, (meta) => ({ ...meta, isBlurred: true }))
  }
}

export const useAppForm: typeof useKitForm = (options) =>
  useKitForm({
    ...options,
    onSubmitInvalid: (props) => {
      revealErrors(props.formApi)
      options.onSubmitInvalid?.(props)
    },
  })
