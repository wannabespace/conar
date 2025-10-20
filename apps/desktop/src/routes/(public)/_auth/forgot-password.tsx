import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@conar/ui/components/form'
import { Input } from '@conar/ui/components/input'
import { arktypeResolver } from '@hookform/resolvers/arktype'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/(public)/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

const schema = type({
  email: 'string.email',
})

function ForgotPasswordPage() {
  const emailRef = useRef<HTMLInputElement>(null)
  const form = useForm<typeof schema.infer>({
    resolver: arktypeResolver(schema),
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus()
    }
  }, [emailRef])

  const { mutate: sendEmail, status } = useMutation({
    mutationFn: async (values: typeof schema.infer) => {
      const { error } = await authClient.forgetPassword({
        email: values.email,
        redirectTo: `${import.meta.env.VITE_PUBLIC_WEB_URL}/reset-password`,
      })

      if (error) {
        throw error
      }
    },
  })

  if (status === 'success') {
    return (
      <div className="flex flex-col justify-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Email sent successfully
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            We've sent you an email with a link to reset your password.
            Click the link and create a new password.
          </p>
        </div>
        <Button asChild>
          <Link to="/sign-in">
            Back to sign In
          </Link>
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
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(v => sendEmail(v))}>
          <FormField
            control={form.control}
            name="email"
            render={({ field: { ref, ...field } }) => (
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
                    ref={(e) => {
                      ref(e)
                      emailRef.current = e
                    }}
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
            disabled={status === 'pending'}
          >
            <LoadingContent loading={status === 'pending'}>
              Send reset link
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
