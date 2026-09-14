import type { AnyFormApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

export const Form = ({
  form,
  ...props
}: Omit<ComponentProps<'form'>, 'onSubmit'> & { form: AnyFormApi }) => (
  <form
    noValidate
    {...props}
    onSubmit={(event) => {
      event.preventDefault()
      form.handleSubmit()
    }}
  />
)
