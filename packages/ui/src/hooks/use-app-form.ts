import { FieldInput, FieldPassword } from '@conar/ui/components/custom/form'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Input: FieldInput,
    Password: FieldPassword,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
