import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { FieldSet } from '@tamery/ui/components/field'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/_auth/reset-password')({
  validateSearch: type({
    token: 'string',
  }),
  onError: () => {
    throw redirect({ to: '/forgot-password' })
  },
  component: ResetPasswordPage,
})

const passwordSchema = type({
  password: type('string >= 8').configure({
    message: 'Password must be at least 8 characters long',
  }),
  confirmPassword: type('string >= 8').configure({
    message: 'Password must be at least 8 characters long',
  }),
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()

  const form = useAppForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    } satisfies typeof passwordSchema.infer,
    validators: {
      onSubmit: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      const { error, data } = await authClient.resetPassword({
        newPassword: value.password,
        token,
      })

      if (error) {
        toast.error('Reset link expired or invalid', {
          description: 'The reset password token is invalid or expired.',
        })
        return
      }

      if (data?.status) {
        toast.success('Password reset successfully', {
          description: 'You can now sign in with your new password.',
        })
        navigate({ to: '/sign-in' })
      } else {
        toast.error('Password reset failed', {
          description: 'Please try again or request a new reset link.',
        })
      }
    },
  })

  const isSubmitting = useStore(form.store, state => state.isSubmitting)

  return (
    <>
      <div className="space-y-2">
        <h1
          className={`
          flex items-center gap-2 text-2xl font-semibold tracking-tight
        `}
        >
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>
      <form
        className="space-y-4"
        onSubmit={e => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldSet className="flex w-full flex-col gap-6">
          <form.AppField name="password">
            {field => (
              <field.Field>
                <field.Label>New Password</field.Label>
                <field.PasswordInput
                  autoFocus
                  autoComplete="new-password"
                  required
                  aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  spellCheck={false}
                  autoCapitalize="none"
                />
                <field.Error />
              </field.Field>
            )}
          </form.AppField>

          <form.AppField
            name="confirmPassword"
            validators={{
              onSubmit: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue('password')
                  ? { message: 'Passwords do not match' }
                  : undefined,
            }}
          >
            {field => (
              <field.Field>
                <field.Label>Confirm Password</field.Label>
                <field.PasswordInput
                  autoComplete="confirm-password"
                  required
                  aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  spellCheck={false}
                  autoCapitalize="none"
                />
                <field.Error />
              </field.Field>
            )}
          </form.AppField>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            <LoadingContent loading={isSubmitting}>Reset password</LoadingContent>
          </Button>
        </FieldSet>
      </form>
    </>
  )
}
