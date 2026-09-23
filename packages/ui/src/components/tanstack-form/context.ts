import type { AnyFieldApi } from '@tanstack/react-form'
import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

export const isFieldInvalid = (field: AnyFieldApi) =>
  !field.state.meta.isValid &&
  (field.state.meta.isBlurred || field.form.state.submissionAttempts > 0)

export const fieldErrorMessage = (field: AnyFieldApi) => {
  if (!isFieldInvalid(field)) {
    return
  }

  const [error] = field.state.meta.errors

  return typeof error === 'string' ? error : error?.message
}

export const formInputProps = (field: AnyFieldApi) => {
  const isInvalid = isFieldInvalid(field)

  return {
    'aria-describedby': isInvalid ? `${field.name}-error` : undefined,
    'aria-invalid': isInvalid ? 'true' : undefined,
    id: field.name,
    onBlur: field.handleBlur,
    onChange: (event: { target: { value: string } }) =>
      field.handleChange(event.target.value),
    value: field.state.value,
  } satisfies ComponentProps<'input'>
}

export type FormInputProps = ReturnType<typeof formInputProps>

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
