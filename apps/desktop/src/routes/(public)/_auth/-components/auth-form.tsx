import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { FieldGroup } from '@conar/ui/components/field'
import { Input } from '@conar/ui/components/input'
import { Separator } from '@conar/ui/components/separator'
import { useAppForm } from '@conar/ui/hooks/use-app-form'
import { copy } from '@conar/ui/lib/copy'
import { RiGithubFill, RiGoogleFill } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { type } from 'arktype'
import { nanoid } from 'nanoid'
import { useEffect, useEffectEvent, useState } from 'react'
import { toast } from 'sonner'
import { authClient, bearerToken, codeChallenge, successAuthToast } from '~/lib/auth'
import { handleDeepLink } from '~/lib/deep-links'
import { encrypt } from '~/lib/encryption'
import { handleError } from '~/lib/error'

type Type = 'sign-up' | 'sign-in'

const baseAuthSchema = type({
  email: 'string.email',
  password: 'string >= 8',
})

const signInSchema = baseAuthSchema

const signUpSchema = baseAuthSchema.and({
  name: 'string',
})

type SignUpFormData = typeof signUpSchema.infer

function useSocialMutation(provider: 'google' | 'github', onSuccess: () => void) {
  return useMutation({
    mutationKey: ['social', provider],
    mutationFn: async () => {
      const codeChallengeId = nanoid()

      codeChallenge.set(codeChallengeId)

      // TODO: move to backend
      const encryptedCodeChallenge = await encrypt(codeChallengeId, import.meta.env.VITE_PUBLIC_AUTH_SECRET)

      const { data, error } = await authClient.signIn.social({
        provider,
        disableRedirect: true,
        callbackURL: `${import.meta.env.VITE_PUBLIC_WEB_URL}/open?code-challenge=${encryptedCodeChallenge}`,
        newUserCallbackURL: `${import.meta.env.VITE_PUBLIC_WEB_URL}/open?code-challenge=${encryptedCodeChallenge}&new-user=true`,
      })

      if (error) {
        throw error
      }

      return data.url!
    },
    onSuccess(url) {
      window.open(url, '_blank')
      onSuccess()
    },
    onError: handleError,
  })
}

function SocialAuthForm({ type }: { type: Type }) {
  const { refetch } = authClient.useSession()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isManualAuthOpen, setIsManualAuthOpen] = useState(false)
  const [manualAuthUrl, setManualAuthUrl] = useState('')

  const setManualUrlFromClipboardEvent = useEffectEvent(async () => {
    const text = await navigator.clipboard.readText()

    if (text.startsWith('conar://session')) {
      setManualAuthUrl(text)
    }
  })

  useEffect(() => {
    if (isManualAuthOpen) {
      setManualUrlFromClipboardEvent()
    }
  }, [isManualAuthOpen])

  const handleManualAuthEvent = useEffectEvent(async () => {
    setIsDialogOpen(false)
    const { type } = await handleDeepLink(manualAuthUrl)

    if (type === 'session') {
      refetch()
    }
  })

  useEffect(() => {
    if (manualAuthUrl.startsWith('conar://session')) {
      handleManualAuthEvent()
    }
  }, [manualAuthUrl])

  const { mutate: googleSignIn, isPending: isGoogleSignInPending, data: googleUrl } = useSocialMutation('google', () => {
    setIsDialogOpen(true)
  })
  const { mutate: githubSignIn, isPending: isGithubSignInPending, data: githubUrl } = useSocialMutation('github', () => {
    setIsDialogOpen(true)
  })

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => googleSignIn()}
          disabled={isGoogleSignInPending || isGithubSignInPending}
        >
          <LoadingContent loading={isGoogleSignInPending}>
            <RiGoogleFill className="size-4" />
            {type === 'sign-up' ? 'Sign up' : 'Sign in'}
            {' '}
            with Google
          </LoadingContent>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={isGithubSignInPending || isGoogleSignInPending}
          onClick={() => githubSignIn()}
        >
          <LoadingContent loading={isGithubSignInPending}>
            <RiGithubFill className="size-4" />
            {type === 'sign-up' ? 'Sign up' : 'Sign in'}
            {' '}
            with GitHub
          </LoadingContent>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in on your browser</DialogTitle>
            <DialogDescription>
              We've opened a browser window for you to sign in.
              {' '}
              If no window appeared,
              {' '}
              <button
                type="button"
                className="text-primary cursor-pointer hover:underline"
                onClick={() => copy(googleUrl || githubUrl!, 'URL copied to clipboard')}
              >
                copy the URL
              </button>
              {' '}
              and open the page manually.
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            className="text-xs text-primary cursor-pointer hover:underline"
            onClick={() => setIsManualAuthOpen(true)}
          >
            Click here to paste URL from browser
          </button>
          {isManualAuthOpen && (
            <Input
              autoFocus
              value={manualAuthUrl}
              onChange={e => setManualAuthUrl(e.target.value)}
              placeholder="Paste authentication URL here"
              className="w-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AuthForm({ type }: { type: Type }) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

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
            name: (value as SignUpFormData).name,
          })
        : await authClient.signIn.email({
            email: value.email,
            password: value.password,
          })

      if (error || !(data && data.token)) {
        if (data && !data.token) {
          toast.error('In some reason, we were not able to sign you in. Please try again later.')
          return
        }

        if (type === 'sign-up' && (error!.code === 'USER_ALREADY_EXISTS' || error!.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')) {
          toast.error('User already exists. Please sign in or use a different email address.', {
            action: {
              label: 'Sign in',
              onClick: () => {
                navigate({ to: '/sign-in' })
              },
            },
          })
        }
        else {
          handleError(error)
        }
        return
      }

      bearerToken.set(data.token)
      successAuthToast(type === 'sign-up')
    },
  })

  return (
    <>
      <SocialAuthForm type={type} />
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-6 text-xs text-muted-foreground">
          OR
        </span>
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Password</span>
                    <Button variant="link" size="xs" className="text-muted-foreground" asChild>
                      <Link to="/forgot-password">
                        Forgot password?
                      </Link>
                    </Button>
                  </div>
                  <form.AppField name="password">
                    {field => (
                      <field.Password
                        showPassword={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                        autoComplete="password"
                      />
                    )}
                  </form.AppField>
                </div>
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

          <Button
            className="w-full"
            type="submit"
            disabled={form.state.isSubmitting}
          >
            <LoadingContent loading={form.state.isSubmitting}>
              {type === 'sign-up' ? 'Get started' : 'Sign in'}
            </LoadingContent>
          </Button>
        </FieldGroup>
      </form>
    </>
  )
}
