import type { ComponentProps } from 'react'

import type { FormInputProps } from '.'
import { formInputProps, useFieldContext } from '.'
import { Input } from '../input'

export const FieldInput = (
  props: Omit<ComponentProps<typeof Input>, keyof FormInputProps>
) => {
  const field = useFieldContext()

  return <Input {...props} {...formInputProps(field)} />
}
