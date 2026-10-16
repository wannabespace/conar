import type { ComponentProps } from 'react'

import { InputGroup, InputGroupAddon, InputGroupInput } from '../input-group'
import type { FormInputProps } from './context'
import { formInputProps, useFieldContext } from './context'
import { FieldError } from './field-error'

export const FieldInput = ({
  children,
  variant,
  ...props
}: Omit<ComponentProps<typeof InputGroupInput>, keyof FormInputProps> &
  Pick<ComponentProps<typeof InputGroup>, 'variant'>) => {
  const field = useFieldContext()

  return (
    <InputGroup variant={variant}>
      <InputGroupInput {...props} {...formInputProps(field)} />
      <InputGroupAddon align="inline-end">
        {children}
        <FieldError />
      </InputGroupAddon>
    </InputGroup>
  )
}
