import type { AnyFieldApi } from '@tanstack/react-form'
import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

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
