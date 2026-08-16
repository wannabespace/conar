import type { ComponentProps } from 'react'

import { Input } from '../input'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'

export const FieldInput = (
  props: Omit<ComponentProps<typeof Input>, keyof FormInputProps>
) => {
  const field = useFieldContext()

  return <Input {...props} {...formInputProps(field)} />
}
