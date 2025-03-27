import { Button } from '@connnect/ui/components/button'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { Separator } from '@connnect/ui/components/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { RiEyeLine, RiEyeOffLine, RiGithubFill, RiGoogleFill } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { authClient, bearerToken, codeChallenge, successAuthToast } from '~/lib/auth'
import { encrypt } from '~/lib/encryption'
import { handleError } from '~/lib/error'

type Type = 'sign-up' | 'sign-in'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

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
        newUserCallbackURL: `${import.meta.env.VITE_PUBLIC_WEB_URL}/open?code-challenge=${encryptedCodeChallenge}&newUser=true`,
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

export function AuthForm({ type }: { type: Type }) {
  const [showPassword, setShowPassword] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    resolver: zodResolver(type === 'sign-up' ? schema.extend({ name: z.string().min(1, 'Please enter your name') }) : schema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus()
    }
  }, [emailRef.current])

  const submit = async (values: z.infer<typeof schema>) => {
    const { error, data } = type === 'sign-up'
      ? await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name!,
      })
      : await authClient.signIn.email({
        email: values.email,
        password: values.password,
      })

    if (error || !(data && data.token)) {
      if (data && !data.token) {
        toast.error('In some reason, we were not able to sign you in. Please try again later.')
        return
      }

      if (error!.code === 'USER_ALREADY_EXISTS') {
        // TODO: add button to redirect to sign-in
        // {
        //   action: <Button onClick={() => router.navigate({ to: '/sign-in' })}>Sign in</Button>,
        // }
        toast.error('User already exists. Please sign in or use a different email address.')
      }
      else {
        handleError(error)
      }
      return
    }

    bearerToken.set(data.token)
    successAuthToast(type === 'sign-up')
  }

  const [_, setIsDialogOpen] = useState(false)

  const { mutate: googleSignIn, isPending: isGoogleSignInPending } = useSocialMutation('google', () => setIsDialogOpen(true))
  const { mutate: githubSignIn, isPending: isGithubSignInPending } = useSocialMutation('github', () => setIsDialogOpen(true))

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
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-6 text-xs text-muted-foreground">
          OR
        </span>
      </div>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
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
          {type === 'sign-up' && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      autoComplete="name"
                      spellCheck="false"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoComplete="password"
                      spellCheck="false"
                      required
                      className="pe-10"
                      {...field}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
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
          <Button
            className="w-full"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            <LoadingContent loading={form.formState.isSubmitting}>
              {type === 'sign-up' ? 'Get started' : 'Sign in'}
            </LoadingContent>
          </Button>
        </form>
      </Form>
    </>
  )
}
