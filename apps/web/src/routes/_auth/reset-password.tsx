import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { FieldGroup } from '@conar/ui/components/field'
import { useAppForm } from '@conar/ui/hooks/use-app-form'
import { useStore } from '@tanstack/react-form'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { useState } from 'react'
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
  password: 'string >= 8',
  confirmPassword: 'string >= 8',
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      }
      else {
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
        <h1 className={`
          flex items-center gap-2 text-2xl font-semibold tracking-tight
        `}
        >
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-4">
          <form.AppField name="password">
            {field => (
              <field.Password
                label="New Password"
                showPassword={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                autoFocus
              />
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
              <field.Password
                label="Confirm Password"
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}
          </form.AppField>

          <Button
            className="w-full"
            type="submit"
            disabled={isSubmitting}
          >
            <LoadingContent loading={isSubmitting}>
              Reset password
            </LoadingContent>
          </Button>
        </FieldGroup>
      </form>
    </>
  )
}
