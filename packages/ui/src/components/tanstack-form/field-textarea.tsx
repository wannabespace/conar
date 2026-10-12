import type { ComponentProps } from 'react'

import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../input-group'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'
import { FieldError } from './field-error'

export const FieldTextarea = ({
  variant,
  ...props
}: Omit<ComponentProps<typeof InputGroupTextarea>, keyof FormInputProps> &
  Pick<ComponentProps<typeof InputGroup>, 'variant'>) => {
  const field = useFieldContext()

  return (
    <InputGroup variant={variant}>
      <InputGroupTextarea {...props} {...formInputProps(field)} />
      <InputGroupAddon align="inline-end">
        <FieldError />
      </InputGroupAddon>
    </InputGroup>
  )
}
