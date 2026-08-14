import type { AnyFieldApi } from '@tanstack/react-form'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

import { Field, FieldLabel } from './field'
import { FieldError } from './field-error'
import { FieldInput } from './field-input'
import { FieldPasswordInput } from './field-password-input'

export const formInputProps = (field: AnyFieldApi) => {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return {
    'aria-describedby': isInvalid ? `${field.name}-error` : undefined,
    'aria-invalid': isInvalid ? 'true' : undefined,
    id: field.name,
    onBlur: field.handleBlur,
    onChange: (event) => field.handleChange(event.target.value),
    value: field.state.value,
  } satisfies ComponentProps<'input'>
}

export type FormInputProps = ReturnType<typeof formInputProps>

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

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
