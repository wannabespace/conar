import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { FieldGroup } from '@conar/ui/components/field'
import { useAppForm } from '@conar/ui/hooks/use-app-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type } from 'arktype'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/(public)/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

const emailSchema = type({
  email: 'string.email',
})

function ForgotPasswordPage() {
  const { mutate: sendEmail, status } = useMutation({
    mutationFn: async (values: typeof emailSchema.infer) => {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${import.meta.env.VITE_PUBLIC_WEB_URL}/reset-password`,
      })

      if (error) {
        throw error
      }
    },
  })

  const form = useAppForm({
    defaultValues: {
      email: '',
    } satisfies typeof emailSchema.infer,
    validators: {
      onSubmit: emailSchema,
    },
    onSubmit: ({ value }) => sendEmail(value),
  })

  if (status === 'success') {
    return (
      <div className="flex flex-col justify-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Email sent successfully</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            We've sent you an email with a link to reset your password. Click the link and create a
            new password.
          </p>
        </div>
        <Button asChild>
          <Link to="/sign-in">Back to sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a reset link to reset your password.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <form.AppField name="email">
            {(field) => (
              <field.Input
                label="Email"
                placeholder="example@gmail.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                spellCheck={false}
                autoFocus
              />
            )}
          </form.AppField>

          <Button className="w-full" type="submit" disabled={status === 'pending'}>
            <LoadingContent loading={status === 'pending'}>Send reset link</LoadingContent>
          </Button>

          <Button variant="link" className="w-full text-center text-muted-foreground" asChild>
            <Link to="/sign-in">Back to sign in</Link>
          </Button>
        </FieldGroup>
      </form>
    </>
  )
}
