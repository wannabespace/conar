import type { ComponentProps } from 'react'

import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../input-group'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'
import { FieldError } from './field-error'

export const FieldTextarea = (
  props: Omit<ComponentProps<typeof InputGroupTextarea>, keyof FormInputProps>
) => {
  const field = useFieldContext()

  return (
    <InputGroup>
      <InputGroupTextarea {...props} {...formInputProps(field)} />
      <InputGroupAddon align="inline-end">
        <FieldError />
      </InputGroupAddon>
    </InputGroup>
  )
}
