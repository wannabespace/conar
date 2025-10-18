import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@conar/ui/components/form'
import { arktypeResolver } from '@hookform/resolvers/arktype'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/lib/error'
import PasswordInput from './-components/password-input'
import InvalidTokenBanner from './-components/token-banner'

export const Route = createFileRoute('/(public)/_auth/reset-password')({
  component: ResetPasswordPage,
})

const RESET_TOKEN_KEY = 'conar.reset_token'
const VALID_TOKEN_LENGTH = 24

const schema = type({
  password: 'string >= 8',
  confirmPassword: 'string >= 8',
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [isTokenExpired, setIsTokenExpired] = useState(false)

  const handleInvalidToken = (description: string, shouldExpire = true) => {
    toast.error('Invalid reset token', { description })
    if (shouldExpire) {
      setIsTokenExpired(true)
      setIsValidatingToken(false)
    }
    else {
      navigate({ to: '/forgot-password' })
    }
  }

  useEffect(() => {
    const validateToken = () => {
      const resetToken = sessionStorage.getItem(RESET_TOKEN_KEY)

      if (!resetToken) {
        handleInvalidToken('Please request a new password reset link.', false)
        return
      }

      if (resetToken.length !== VALID_TOKEN_LENGTH) {
        handleInvalidToken('The reset link is invalid or malformed.')
        return
      }

      setToken(resetToken)
      setIsValidatingToken(false)
    }

    validateToken()
  }, [navigate])

  const form = useForm<typeof schema.infer>({
    resolver: arktypeResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const handleResetSuccess = () => {
    sessionStorage.removeItem(RESET_TOKEN_KEY)
    toast.success('Password reset successfully', {
      description: 'You can now sign in with your new password.',
    })
    navigate({ to: '/sign-in' })
  }

  const handleResetError = () => {
    setIsTokenExpired(true)
    sessionStorage.removeItem(RESET_TOKEN_KEY)
    toast.error('Reset link expired or invalid', {
      description: 'The reset password token is invalid or expired.',
    })
  }

  const submit = async (values: typeof schema.infer) => {
    if (!token) {
      toast.error('No reset token found', {
        description: 'Please request a new password reset link.',
      })
      navigate({ to: '/forgot-password' })
      return
    }

    if (values.password !== values.confirmPassword) {
      form.setError('confirmPassword', {
        message: 'Passwords do not match',
      })
      return
    }

    try {
      const { error, data } = await authClient.resetPassword({
        newPassword: values.password,
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
  }

  if (isValidatingToken || !token) {
    return (
      <LoadingContent loading>
        <div />
      </LoadingContent>
    )
  }

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

      {isTokenExpired && <InvalidTokenBanner onNavigate={() => navigate({ to: '/forgot-password' })} />}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    field={field}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    field={field}
                    showPassword={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="w-full"
            type="submit"
            disabled={form.formState.isSubmitting || isTokenExpired}
          >
            <LoadingContent loading={form.formState.isSubmitting}>
              Reset password
            </LoadingContent>
          </Button>
        </form>
      </Form>
    </>
  )
}
