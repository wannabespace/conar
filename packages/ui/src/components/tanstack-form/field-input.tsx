import type { ComponentProps } from 'react'

import { InputGroup, InputGroupAddon, InputGroupInput } from '../input-group'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'
import { FieldError } from './field-error'

export const FieldInput = (
  props: Omit<ComponentProps<typeof InputGroupInput>, keyof FormInputProps>
) => {
  const field = useFieldContext()

  return (
    <InputGroup>
      <InputGroupInput {...props} {...formInputProps(field)} />
      <InputGroupAddon align="inline-end">
        <FieldError />
      </InputGroupAddon>
    </InputGroup>
  )
}
