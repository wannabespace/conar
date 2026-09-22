import type { AnyFormApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

const focusInvalidField = (element: HTMLFormElement, form: AnyFormApi) => {
  const invalid = Object.keys(form.state.fieldMeta).find(
    (name) => !form.state.fieldMeta[name]?.isValid
  )

  if (invalid) {
    element.querySelector<HTMLElement>(`#${CSS.escape(invalid)}`)?.focus()
  }
}

export const Form = ({
  form,
  ...props
}: Omit<ComponentProps<'form'>, 'onSubmit'> & { form: AnyFormApi }) => (
  <form
    noValidate
    {...props}
    onSubmit={async (event) => {
      event.preventDefault()
      const element = event.currentTarget

      await form.handleSubmit()
      focusInvalidField(element, form)
    }}
  />
)
