import type { AnyFieldApi } from '@tanstack/react-form'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

import { FieldError } from './field-error'
import { FieldInput } from './field-input'
import { FieldPasswordInput } from './field-password-input'

export function formInputProps(field: AnyFieldApi) {
  return {
    'aria-invalid': field.state.meta.isTouched && !field.state.meta.isValid ? 'true' : undefined,
    value: field.state.value,
    onChange: event => field.handleChange(event.target.value),
    onBlur: field.handleBlur,
  } satisfies ComponentProps<'input'>
}

export type FormInputProps = ReturnType<typeof formInputProps>

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Input: FieldInput,
    PasswordInput: FieldPasswordInput,
    Error: FieldError,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
