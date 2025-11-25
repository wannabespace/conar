import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { FieldGroup } from '@conar/ui/components/field'
import { useAppForm } from '@conar/ui/hooks/use-app-form'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient, resetToken } from '~/lib/auth'
import { handleError } from '~/lib/error'

export const Route = createFileRoute('/(public)/_auth/reset-password')({
  loader: () => {
    const token = resetToken.get()

    if (!token) {
      toast.error('Invalid reset token', {
        description: 'Please request a new password reset link.',
      })
      throw redirect({ to: '/forgot-password' })
    }

    return { token }
  },
  component: ResetPasswordPage,
})

const passwordSchema = type({
  password: 'string >= 8',
  confirmPassword: 'string >= 8',
})

type FormData = typeof passwordSchema.infer

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useLoaderData()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleResetSuccess = () => {
    resetToken.remove()
    toast.success('Password reset successfully', {
      description: 'You can now sign in with your new password.',
    })
    navigate({ to: '/sign-in' })
  }

  const handleResetError = () => {
    resetToken.remove()
    toast.error('Reset link expired or invalid', {
      description: 'The reset password token is invalid or expired.',
    })
  }

  const form = useAppForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    } satisfies FormData as FormData,

    validators: {
      onSubmit: passwordSchema,
    },

    onSubmit: async ({ value }) => {
      try {
        const { error, data } = await authClient.resetPassword({
          newPassword: value.password,
          token,
        })

        if (error) {
          handleResetError()
          return
        }

        if (data?.status) {
          handleResetSuccess()
        }
        else {
          toast.error('Password reset failed', {
            description: 'Please try again or request a new reset link.',
          })
        }
      }
      catch (error) {
        handleError(error)
      }
    },
  })

  return (
    <>
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
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
            disabled={form.state.isSubmitting}
          >
            <LoadingContent loading={form.state.isSubmitting}>
              Reset password
            </LoadingContent>
          </Button>
          <Button
            variant="link"
            className="w-full text-center text-muted-foreground"
            asChild
          >
            <Link to="/sign-in">
              Back to sign in
            </Link>
          </Button>
        </FieldGroup>
      </form>
    </>
  )
}
