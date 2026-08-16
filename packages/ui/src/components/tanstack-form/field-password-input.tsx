import type { ComponentProps } from 'react'

import { PasswordInput } from '../custom/password-input'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'

export const FieldPasswordInput = (
  props: Omit<ComponentProps<typeof PasswordInput>, keyof FormInputProps>
) => {
  const field = useFieldContext()

  return <PasswordInput {...props} {...formInputProps(field)} />
}
