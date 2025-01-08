import { Button } from '@connnect/ui/components/button'
import { RiGithubFill, RiGoogleFill } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-shell'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { env } from '~/env'
import { authClient, setCodeChallenge } from '~/lib/auth'
import { createEncryptor } from '~/lib/secrets'
import { AuthForm } from './-components/form'

export const Route = createFileRoute('/(public)/_auth/sign-up')({
  component: SignInPage,
})

function SignInPage() {
  const { mutate: googleSignIn } = useMutation({
    mutationKey: ['google'],
    mutationFn: async () => {
      const encryptor = await createEncryptor(env.VITE_PUBLIC_AUTH_SECRET)
      const codeChallenge = nanoid()

      setCodeChallenge(codeChallenge)

      const encryptedCodeChallenge = await encryptor.encrypt(codeChallenge)

      const { data, error } = await authClient.signIn.social({
        provider: 'google',
        disableRedirect: true,
        callbackURL: `${env.VITE_PUBLIC_APP_URL}/open?code-challenge=${encryptedCodeChallenge}`,
        newUserCallbackURL: `${env.VITE_PUBLIC_APP_URL}/open?code-challenge=${encryptedCodeChallenge}&newUser=true`,
      })

      if (error) {
        throw error
      }

      return data.url!
    },
    onSuccess(url) {
      open(url)
    },
    onError(error) {
      toast.error(error.message)
    },
  })

  return (
    <>
      <div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Getting started
          </h1>
          <p className="text-sm">
            access to personalized features, seamless navigation, and a suite of
            tools tailored to meet your needs.
          </p>
        </div>
        <div className="space-y-4">
          <div className="text-center text-sm">Or continue with</div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => googleSignIn()}
            >
              <RiGoogleFill className="size-4" />
              Login with Google
            </Button>
            <Button variant="outline" className="w-full">
              <RiGithubFill className="size-4" />
              Login with Apple
            </Button>
          </div>
        </div>
        <AuthForm type="sign-up" />
      </div>
      <div>
        124
      </div>
    </>
  )
}
