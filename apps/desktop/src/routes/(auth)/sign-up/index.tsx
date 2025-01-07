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
import { SignUpForm } from './-components/form'

export const Route = createFileRoute('/(auth)/sign-up/')({
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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 lg:p-12">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="size-6 rounded bg-primary" />
            <span className="text-xl font-semibold">Justd</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Getting started</h1>
            <p className="text-muted-foreground text-sm">
              Enter your details below to get started using our platform and gain access to
              personalized features, seamless navigation, and a suite of tools tailored to
              meet your needs.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-muted-foreground text-center text-sm">
              Or continue with
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full" onClick={() => googleSignIn()}>
                <RiGoogleFill className="size-4" />
                Login with Google
              </Button>
              <Button variant="outline" className="w-full">
                <RiGithubFill className="size-4" />
                Login with Apple
              </Button>
            </div>
          </div>

          <SignUpForm />
        </div>
      </div>
      <div className="hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="text-primary-foreground mx-auto flex max-w-[420px] flex-col items-center text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Justd</h2>
            <p className="text-lg">
              made integrating accessible React components into my project effortless. The
              Tailwind CSS support meant I could achieve a polished design without breaking
              a sweat.
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <img
              src="/placeholder.svg?height=40&width=40"
              alt="Avatar"
              className="rounded-full"
              width={40}
              height={40}
            />
            <div className="text-left">
              <div className="text-sm font-medium">Kurt Cobain</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-primary-foreground/10 size-6 rounded" />
          <div className="bg-primary-foreground/10 size-6 rounded" />
          <div className="bg-primary-foreground/10 size-6 rounded" />
          <div className="bg-primary-foreground/10 size-6 rounded" />
          <div className="bg-primary-foreground/10 size-6 rounded" />
          <div className="bg-primary-foreground/10 size-6 rounded" />
        </div>
      </div>
    </div>
  )
}
