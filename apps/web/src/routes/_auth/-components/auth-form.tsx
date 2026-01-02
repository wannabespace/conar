import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { FieldGroup } from '@conar/ui/components/field'
import { Separator } from '@conar/ui/components/separator'
import { useAppForm } from '@conar/ui/hooks/use-app-form'
import { RiGithubFill, RiGoogleFill } from '@remixicon/react'
import { useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

type Type = 'sign-up' | 'sign-in'

const baseAuthSchema = type({
  email: 'string.email',
  password: 'string >= 8',
})

const signInSchema = baseAuthSchema

const signUpSchema = baseAuthSchema.and({
  name: 'string',
})

function useSocialMutation(provider: 'google' | 'github') {
  const router = useRouter()
  const { url } = router.buildLocation({ to: '/account' })

  return useMutation({
    mutationKey: ['social', provider],
    mutationFn: async () => {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: url.href,
      })

      if (error) {
        throw error
      }
    },
  })
}

function Last() {
  return (
    <Badge
      variant="secondary"
      className="pointer-events-none absolute -top-2 -right-2"
    >
      Last
    </Badge>
  )
}

function SocialAuthForm() {
  const lastMethod = authClient.getLastUsedLoginMethod()
  const { mutate: googleSignIn, isPending: isGoogleSignInPending } = useSocialMutation('google')
  const { mutate: githubSignIn, isPending: isGithubSignInPending } = useSocialMutation('github')

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => googleSignIn()}
            disabled={isGoogleSignInPending || isGithubSignInPending}
          >
            <LoadingContent loading={isGoogleSignInPending}>
              <RiGoogleFill className="size-4" />
              Google
            </LoadingContent>
          </Button>
          {lastMethod === 'google' && <Last />}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full"
            disabled={isGithubSignInPending || isGoogleSignInPending}
            onClick={() => githubSignIn()}
          >
            <LoadingContent loading={isGithubSignInPending}>
              <RiGithubFill className="size-4" />
              GitHub
            </LoadingContent>
          </Button>
          {lastMethod === 'github' && <Last />}
        </div>
      </div>
    </>
  )
}

export function AuthForm({ type }: { type: Type }) {
  const lastMethod = authClient.getLastUsedLoginMethod()
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const form = useAppForm({
    defaultValues: type === 'sign-up'
      ? { email: '', password: '', name: '' }
      : { email: '', password: '' },
    validators: {
      onSubmit: type === 'sign-up' ? signUpSchema : signInSchema,
    },
    onSubmit: async ({ value }) => {
      const { error, data } = type === 'sign-up'
        ? await authClient.signUp.email({
            email: value.email,
            password: value.password,
            name: (value as typeof signUpSchema.infer).name,
          })
        : await authClient.signIn.email({
            email: value.email,
            password: value.password,
          })

      if (error || !(data && data.token)) {
        if (data && !data.token) {
          toast.error('For some reason, we were not able to sign you in. Please try again later.')
          return
        }

        if (type === 'sign-up' && (error!.code === 'USER_ALREADY_EXISTS' || error!.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')) {
          toast.error('User already exists. Please sign in or use a different email address.', {
            action: {
              label: 'Sign in',
              onClick: () => {
                router.navigate({ to: '/sign-in' })
              },
            },
          })
        }
        else {
          handleError(error)
        }
      }

      router.invalidate()
    },
  })

  const isSubmitting = useStore(form.store, state => state.isSubmitting)

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {type === 'sign-up' ? 'Create an account' : 'Sign in to your account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {type === 'sign-up'
            ? 'Already have an account?'
            : 'Don\'t have an account?'}
          {' '}
          <Link to={type === 'sign-up' ? '/sign-in' : '/sign-up'}>
            {type === 'sign-up' ? 'Sign in' : 'Sign up'}
          </Link>
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
          <form.AppField name="email">
            {field => (
              <field.Input
                label="Email"
                placeholder="example@gmail.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                spellCheck={false}
                required
                autoFocus
              />
            )}
          </form.AppField>

          {type === 'sign-up' && (
            <form.AppField name="name">
              {field => (
                <field.Input
                  label="Name"
                  placeholder="John Doe"
                  autoComplete="name"
                  spellCheck={false}
                  required
                />
              )}
            </form.AppField>
          )}

          {type === 'sign-in'
            ? (
                <form.AppField name="password">
                  {field => (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Password</span>
                        <Button
                          variant="link"
                          size="xs"
                          className="text-muted-foreground"
                          asChild
                        >
                          <Link to="/forgot-password">
                            Forgot password?
                          </Link>
                        </Button>
                      </div>
                      <field.Password
                        showPassword={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                        autoComplete="password"
                      />
                    </div>
                  )}
                </form.AppField>
              )
            : (
                <form.AppField name="password">
                  {field => (
                    <field.Password
                      label="Password"
                      showPassword={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                      autoComplete="password"
                    />
                  )}
                </form.AppField>
              )}
          <div className="relative">
            <Button
              className="w-full"
              type="submit"
              disabled={isSubmitting}
            >
              <LoadingContent loading={isSubmitting}>
                {type === 'sign-up' ? 'Get started' : 'Sign in'}
              </LoadingContent>
            </Button>
            {type === 'sign-in' && lastMethod === 'email' && <Last />}
          </div>
        </FieldGroup>
      </form>
      <div className="relative">
        <Separator />
        <span className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          bg-background px-4 text-sm text-muted-foreground
        `}
        >
          Or continue with
        </span>
      </div>
      <SocialAuthForm />
    </>
  )
}
