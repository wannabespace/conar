import type { ComponentProps } from 'react'

import type { FormInputProps } from '.'
import { formInputProps, useFieldContext } from '.'
import { PasswordInput } from '../custom/password-input'

export function FieldPasswordInput(props: Omit<ComponentProps<typeof PasswordInput>, keyof FormInputProps>) {
  const field = useFieldContext()

  return <PasswordInput {...props} {...formInputProps(field)} />
}
