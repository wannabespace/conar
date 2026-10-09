import { GithubIcon, GoogleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { FieldSet } from '@tamery/ui/components/field'
import { Separator } from '@tamery/ui/components/separator'
import { Form, useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'
import { BASE_ERROR_CODES } from 'better-auth'
import { toast } from 'sonner'

import { authClient, getLastUsedLoginMethod } from '~/lib/auth'
import { handleError } from '~/utils/error'

import {
  sendSignInCode,
  twoFactorRedirectSchema,
  useFinishSignIn,
} from '../-lib/sign-in'

const { useSearch } = getRouteApi('/_auth')

type Type = 'sign-up' | 'sign-in'

const baseAuthSchema = type({
  email: type('string.email').configure({ message: 'Invalid email address' }),
  password: type('string >= 8').configure({
    message: 'Password must be at least 8 characters long',
  }),
})

const signInSchema = baseAuthSchema

const emailSchema = baseAuthSchema.pick('email')

const signUpSchema = baseAuthSchema.and({
  name: type('string').configure({ message: 'Name is required' }),
})

const SOCIAL_PROVIDERS = [
  {
    icon: (
      <HugeiconsIcon icon={GoogleIcon} strokeWidth={2} className="size-4" />
    ),
    id: 'google',
    label: 'Google',
  },
  {
    icon: (
      <HugeiconsIcon icon={GithubIcon} strokeWidth={2} className="size-4" />
    ),
    id: 'github',
    label: 'GitHub',
  },
]

const Last = () => (
  <Badge
    variant="secondary"
    className="pointer-events-none absolute -top-2 -right-2"
  >
    Last
  </Badge>
)

const SocialButton = ({
  provider,
}: {
  provider: (typeof SOCIAL_PROVIDERS)[number]
}) => {
  const { redirectPath } = useSearch()
  const router = useRouter()
  const { href } = router.buildLocation({ to: '/account' })
  const isAnyPending = useIsMutating({ mutationKey: ['social'] }) > 0
  const { mutate, isPending } = useMutation({
    mutationKey: ['social', provider.id],
    mutationFn: async () => {
      const callbackUrl = new URL(location.origin + (redirectPath || href))
      const newUserCallbackUrl = new URL(callbackUrl)

      newUserCallbackUrl.searchParams.set('newUser', 'true')

      const { error } = await authClient.signIn.social({
        provider: provider.id,
        callbackURL: callbackUrl.href,
        newUserCallbackURL: newUserCallbackUrl.href,
      })

      if (error) {
        throw error
      }
    },
    onError: handleError,
  })

  return (
    <Button
      variant="outline"
      className="relative w-full"
      onClick={() => mutate()}
      disabled={isAnyPending}
    >
      <LoadingContent loading={isPending}>
        {provider.icon}
        {provider.label}
      </LoadingContent>
      {getLastUsedLoginMethod() === provider.id && <Last />}
    </Button>
  )
}

const SocialAuthForm = () => (
  <div className="grid grid-cols-2 gap-4">
    {SOCIAL_PROVIDERS.map((provider) => (
      <SocialButton key={provider.id} provider={provider} />
    ))}
  </div>
)

export const AuthForm = ({ type: authType }: { type: Type }) => {
  const search = useSearch()
  const lastMethod = getLastUsedLoginMethod()
  const router = useRouter()
  const finishSignIn = useFinishSignIn()

  const form = useAppForm({
    defaultValues:
      authType === 'sign-up'
        ? { email: '', password: '', name: '' }
        : { email: '', password: '' },
    validators: {
      onChange: authType === 'sign-up' ? signUpSchema : signInSchema,
    },
    onSubmit: async ({ value }) => {
      const { error, data } =
        authType === 'sign-up'
          ? await authClient.signUp.email({
              email: value.email,
              password: value.password,
              name: (value as typeof signUpSchema.infer).name,
            })
          : await authClient.signIn.email({
              email: value.email,
              password: value.password,
            })

      if (authType === 'sign-in' && twoFactorRedirectSchema.allows(data)) {
        await router.navigate({ to: '/two-factor', search })
        return
      }

      if (error || !(data && data.token)) {
        if (data && !data.token) {
          toast.error(
            'For some reason, we were not able to sign you in. Please try again later.'
          )
          return
        }

        const isUserExistsError =
          error?.code === BASE_ERROR_CODES.USER_ALREADY_EXISTS.code ||
          error?.code ===
            BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL.code

        if (authType === 'sign-up' && isUserExistsError) {
          toast.error(
            'User already exists. Please sign in or use a different email address.',
            {
              action: {
                label: 'Sign in',
                onClick: () => {
                  router.navigate({ to: '/sign-in', search })
                },
              },
            }
          )
        } else {
          handleError(error)
        }
      }

      await finishSignIn({ newUser: authType === 'sign-up' })
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const canSendCode = useStore(form.store, (state) =>
    emailSchema.allows({ email: state.values.email })
  )

  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: sendSignInCode,
    onSuccess: (_, email) =>
      router.navigate({ to: '/email-code', search: { ...search, email } }),
    onError: handleError,
  })

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {authType === 'sign-up'
            ? 'Create an account'
            : 'Sign in to your account'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {authType === 'sign-up'
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}
          <Link
            to={authType === 'sign-up' ? '/sign-in' : '/sign-up'}
            search={search}
          >
            {authType === 'sign-up' ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
      <Form form={form}>
        <FieldSet className="w-full">
          <form.AppField name="email">
            {(field) => (
              <field.Field>
                <field.Label>Email</field.Label>
                <field.Input
                  placeholder="example@gmail.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  autoFocus
                />
              </field.Field>
            )}
          </form.AppField>
          {authType === 'sign-up' && (
            <form.AppField name="name">
              {(field) => (
                <field.Field>
                  <field.Label>Name</field.Label>
                  <field.Input
                    placeholder="John Doe"
                    autoComplete="name"
                    spellCheck={false}
                    required
                  />
                </field.Field>
              )}
            </form.AppField>
          )}
          <form.AppField name="password">
            {(field) => (
              <field.Field>
                <div className="flex w-full items-center justify-between">
                  <field.Label>Password</field.Label>
                  {authType === 'sign-in' && (
                    <Button
                      variant="link-muted"
                      size="xs"
                      render={<Link to="/forgot-password" />}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <field.PasswordInput
                  autoComplete="password"
                  placeholder="••••••••"
                />
              </field.Field>
            )}
          </form.AppField>
          <Button
            className="relative w-full"
            type="submit"
            disabled={isSubmitting}
          >
            <LoadingContent loading={isSubmitting}>
              {authType === 'sign-up' ? 'Get started' : 'Sign in'}
            </LoadingContent>
            {authType === 'sign-in' && lastMethod === 'email' && <Last />}
          </Button>
          {authType === 'sign-in' && (
            <Button
              variant="ghost-muted"
              className="relative w-full"
              onClick={() => sendCode(form.getFieldValue('email'))}
              disabled={isSendingCode || !canSendCode}
            >
              <LoadingContent loading={isSendingCode}>
                Email me a code instead
              </LoadingContent>
              {lastMethod === 'email-otp' && <Last />}
            </Button>
          )}
        </FieldSet>
      </Form>
      <div className="relative">
        <Separator />
        <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-1/2 px-4 text-sm">
          Or continue with
        </span>
      </div>
      <SocialAuthForm />
    </>
  )
}
