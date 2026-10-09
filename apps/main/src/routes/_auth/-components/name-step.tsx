import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { FieldSet } from '@tamery/ui/components/field'
import { Form, useAppForm } from '@tamery/ui/components/tanstack-form'
import { useMutation } from '@tanstack/react-query'
import { type } from 'arktype'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import { useFinishSignIn } from '../-lib/sign-in'

const nameSchema = type({
  name: type(/\S/u).configure({ message: 'Name is required' }),
})

export const NameStep = () => {
  const finishSignIn = useFinishSignIn()

  const { mutate: saveName, isPending } = useMutation({
    mutationFn: (name: string) =>
      authClient.updateUser({ fetchOptions: { throw: true }, name }),
    onSuccess: () => finishSignIn({ newUser: true }),
    onError: handleError,
  })

  const form = useAppForm({
    defaultValues: { name: '' },
    validators: { onChange: nameSchema },
    onSubmit: ({ value }) => saveName(value.name.trim()),
  })

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Tamery
        </h1>
        <p className="text-muted-foreground text-sm">
          What should we call you?
        </p>
      </div>
      <Form form={form}>
        <FieldSet className="w-full">
          <form.AppField name="name">
            {(field) => (
              <field.Field>
                <field.Label>Name</field.Label>
                <field.Input
                  placeholder="John Doe"
                  autoComplete="name"
                  spellCheck={false}
                  required
                  autoFocus
                />
              </field.Field>
            )}
          </form.AppField>
          <Button className="w-full" type="submit" disabled={isPending}>
            <LoadingContent loading={isPending}>Continue</LoadingContent>
          </Button>
        </FieldSet>
      </Form>
    </>
  )
}
