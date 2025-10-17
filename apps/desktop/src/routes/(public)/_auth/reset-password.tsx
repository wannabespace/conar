import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@conar/ui/components/form'
import { Input } from '@conar/ui/components/input'
import { arktypeResolver } from '@hookform/resolvers/arktype'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/lib/error'

export const Route = createFileRoute('/(public)/_auth/reset-password')({
  component: ResetPasswordPage,
})

const schema = type({
  password: 'string >= 8',
  confirmPassword: 'string >= 8',
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const resetToken = sessionStorage.getItem('conar.reset_token')
    if (!resetToken) {
      toast.error('Invalid reset link', {
        description: 'Please request a new password reset link.',
      })
      navigate({ to: '/forgot-password' })
      return
    }
    setToken(resetToken)
  }, [navigate])

  const form = useForm<typeof schema.infer>({
    resolver: arktypeResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const submit = async (values: typeof schema.infer) => {
    if (!token) {
      toast.error('No reset token found')
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
        handleError(error)
        return
      }

      if (data?.status) {
        sessionStorage.removeItem('conar.reset_token')

        toast.success('Password reset successfully', {
          description: 'You can now sign in with your new password.',
        })
        navigate({ to: '/sign-in' })
      }
      else {
        toast.error('Password reset failed', {
          description: 'Please try again or contact support.',
        })
      }
    }
    catch (error) {
      handleError(error)
    }
  }

  if (!token) {
    return null
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

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      spellCheck="false"
                      required
                      className="pe-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword
                        ? (
                            <RiEyeOffLine className="size-4" />
                          )
                        : (
                            <RiEyeLine className="size-4" />
                          )}
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
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
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      spellCheck="false"
                      required
                      className="pe-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword
                        ? (
                            <RiEyeOffLine className="size-4" />
                          )
                        : (
                            <RiEyeLine className="size-4" />
                          )}
                      <span className="sr-only">
                        {showConfirmPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="w-full"
            type="submit"
            disabled={form.formState.isSubmitting}
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
