import { Button } from '@connnect/ui/components/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@connnect/ui/components/form'
import { Input } from '@connnect/ui/components/input'
import { Separator } from '@connnect/ui/components/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { RiEyeLine, RiEyeOffLine, RiGithubFill, RiGoogleFill } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
// import { shell } from 'electron'
import { nanoid } from 'nanoid'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { env } from '~/env'
import { authClient, setBearerToken, setCodeChallenge, successAuthToast } from '~/lib/auth'
import { handleError } from '~/lib/error'

type Type = 'sign-up' | 'sign-in'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

function useSocialMutation(provider: 'google' | 'github') {
  return useMutation({
    mutationKey: [provider],
    mutationFn: async () => {
      // const encryptor = await createEncryptor(env.VITE_PUBLIC_AUTH_SECRET)
      const codeChallenge = nanoid()

      setCodeChallenge(codeChallenge)

      const encryptedCodeChallenge = await window.electron.encryption.encrypt({
        text: codeChallenge,
        secret: env.VITE_PUBLIC_AUTH_SECRET,
      })

      const { data, error } = await authClient.signIn.social({
        provider,
        disableRedirect: true,
        callbackURL: `${env.VITE_PUBLIC_APP_URL}/open?code-challenge=${encryptedCodeChallenge}`,
        newUserCallbackURL: `${env.VITE_PUBLIC_APP_URL}/open?code-challenge=${encryptedCodeChallenge}&newUser=true`,
      })

      if (error) {
        throw error
      }

      return data.url!
    },
    onSuccess(_url) {
      // shell.openExternal(url)
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

    await setBearerToken(data.token)

    successAuthToast(type === 'sign-up')
  }

  const { mutate: googleSignIn, isPending: isGoogleSignInPending } = useSocialMutation('google')
  const { mutate: githubSignIn, isPending: isGithubSignInPending } = useSocialMutation('github')

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => googleSignIn()}
          disabled={isGithubSignInPending}
          loading={isGoogleSignInPending}
        >
          <RiGoogleFill className="size-4" />
          {type === 'sign-up' ? 'Sign up' : 'Sign in'}
          {' '}
          with Google
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={isGoogleSignInPending}
          onClick={() => githubSignIn()}
          loading={isGithubSignInPending}
        >
          <RiGithubFill className="size-4" />
          {type === 'sign-up' ? 'Sign up' : 'Sign in'}
          {' '}
          with GitHub
        </Button>
      </div>
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-body px-2 text-xs text-muted-foreground">
          OR
        </span>
      </div>
      <Form {...form} className="space-y-4" onSubmit={submit}>
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
                    placeholder="super_secret_password"
                    type={showPassword ? 'text' : 'password'}
                    autoCapitalize="none"
                    autoComplete="password"
                    spellCheck="false"
                    required
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
          loading={form.formState.isSubmitting}
          type="submit"
        >
          {type === 'sign-up' ? 'Get started' : 'Sign in'}
        </Button>
      </Form>
    </>
  )
}
