import { Button } from '@conar/ui/components/button'
import { Card, CardContent } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@conar/ui/components/form'
import { Input } from '@conar/ui/components/input'
import { arktypeResolver } from '@hookform/resolvers/arktype'
import { RiMailLine } from '@remixicon/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type } from 'arktype'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/lib/error'

export const Route = createFileRoute('/(public)/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

const schema = type({
  email: 'string.email',
})

function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false)

  const emailForm = useForm<typeof schema.infer>({
    resolver: arktypeResolver(schema),
    defaultValues: {
      email: '',
    },
  })

  const submitEmail = async (values: typeof schema.infer) => {
    try {
      const { error } = await authClient.forgetPassword({
        email: values.email,
        redirectTo: `${import.meta.env.VITE_PUBLIC_WEB_URL}/reset-password`,
      })

      if (error) {
        handleError(error)
        return
      }

      setEmailSent(true)
      toast.success('Password reset email sent', {
        description: 'Check your email and click the link to reset your password.',
      })
    }
    catch (error) {
      handleError(error)
    }
  }

  if (emailSent) {
    return (
      <>
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <RiMailLine className="size-5 text-green-600 dark:text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Email sent successfully
                </p>
                <p className="text-sm text-green-700 dark:text-green-200/80">
                  Click the link in your email to reset your password. The link will automatically open the desktop app.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm space-y-3 pt-2">
          <button
            onClick={() => setEmailSent(false)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Send to a different email
          </button>
          <div>
            <Link
              to="/sign-in"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </>
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

      <Form {...emailForm}>
        <form className="space-y-4" onSubmit={emailForm.handleSubmit(submitEmail)}>
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="example@gmail.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    spellCheck="false"
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="w-full"
            type="submit"
            disabled={emailForm.formState.isSubmitting}
          >
            <LoadingContent loading={emailForm.formState.isSubmitting}>
              Send reset link
            </LoadingContent>
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link to="/sign-in" className="text-muted-foreground hover:text-primary">
          Back to sign in
        </Link>
      </div>
    </>
  )
}
