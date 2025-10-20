import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@conar/ui/components/form'
import { arktypeResolver } from '@hookform/resolvers/arktype'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { authClient, resetToken } from '~/lib/auth'
import { handleError } from '~/lib/error'
import PasswordInput from './-components/password-input'

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

const schema = type({
  password: 'string >= 8',
  confirmPassword: 'string >= 8',
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useLoaderData()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus()
    }
  }, [passwordRef])

  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

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

  const submit = async (values: typeof schema.infer) => {
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
            render={({ field: { ref, ...field } }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    ref={(e) => {
                      ref(e)
                      passwordRef.current = e
                    }}
                    {...field}
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
                    {...field}
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
            disabled={form.formState.isSubmitting}
          >
            <LoadingContent loading={form.formState.isSubmitting}>
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
        </form>
      </Form>
    </>
  )
}
