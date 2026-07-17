import { RiErrorWarningLine } from '@remixicon/react'
import { challenge } from '@tamery/shared/utils/challenge'
import { title } from '@tamery/shared/utils/title'
import { Badge } from '@tamery/ui/components/badge'
import { AppLogoMotion } from '@tamery/ui/components/brand/app-logo.utils'
import { Button } from '@tamery/ui/components/button'
import { skipToken, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { TitleBar } from '~/components/title-bar'
import { enterAppAnimation } from '~/global-hooks'
import { authClient, bearerToken, successAuthToast } from '~/lib/auth'
import { lastLocationStorageValue } from '~/lib/last-location'
import { orpc } from '~/lib/orpc'
import { router } from '~/main'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
  head: () => ({
    meta: [{ title: title('Sign in') }],
  }),
})

function AuthPage() {
  const { refetch } = authClient.useSession()
  const [verifier, setVerifier] = useState<string | null>(null)
  const [codeChallenge, setCodeChallenge] = useState<string | null>(null)

  const signInWithChallenge = async () => {
    const verifier = challenge.noble.generateVerifier()
    const codeChallenge = challenge.noble.generateCode(verifier)
    setVerifier(verifier)
    setCodeChallenge(codeChallenge)
    const url = `${import.meta.env.VITE_PUBLIC_MAIN_URL}/deep/sign-in?codeChallenge=${codeChallenge}&type=${window.electron ? 'desktop' : 'web'}`
    if (window.electron) {
      window.open(url, '_blank')
    } else {
      location.assign(url)
    }
  }

  const { data, error, isPending } = useQuery(
    orpc.account.challenge.listen.experimental_liveOptions({
      input: codeChallenge ? { codeChallenge } : skipToken,
      throwOnError: false,
    }),
  )

  const { mutate: exchange } = useMutation(
    orpc.account.challenge.exchange.mutationOptions({
      onSuccess: async data => {
        bearerToken.set(data.token)
        await refetch()
        router.navigate({ href: lastLocationStorageValue.get() ?? '/' })
        successAuthToast(!!data.newUser)
      },
    }),
  )

  useEffect(() => {
    enterAppAnimation()
  }, [])

  useEffect(() => {
    if (!data?.ready || !codeChallenge || !verifier) {
      return
    }

    exchange({ codeChallenge, verifier, type: 'noble' })
  }, [data, exchange, codeChallenge, verifier])

  return (
    <>
      {window.electron && <TitleBar className="-mb-10" />}
      <div className="relative flex flex-col overflow-hidden px-4 py-6">
        <div
          className="
          m-auto flex w-full max-w-md flex-1 flex-col justify-center
        "
        >
          <motion.div
            className="
              relative mb-8 flex size-12 items-center justify-center rounded-2xl
              bg-primary will-change-transform
            "
            initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)', filter: 'none' }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <AppLogoMotion
              className="size-8.5 text-white will-change-transform"
              initial={{ rotate: 180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 3, delay: 0.6, type: 'spring' }}
            />
          </motion.div>
          <motion.div
            className="will-change-transform"
            initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)', filter: 'none' }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <h1
              className="
              text-2xl font-semibold tracking-tight text-foreground
            "
            >
              Sign in to continue
            </h1>
            <p className="mt-2 mb-8 text-muted-foreground">
              Sync your connections, queries, and chats across every device.
            </p>
          </motion.div>
          <motion.div
            className="will-change-transform"
            initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)', filter: 'none' }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button className="mb-2 w-full" size="lg" onClick={() => signInWithChallenge()}>
              {!!codeChallenge && isPending ? (
                <span className="animate-pulse">Waiting for sign in...</span>
              ) : (
                'Sign In'
              )}
            </Button>
            <p className="mb-4 text-center text-xs text-muted-foreground">
              Sign-in unlocks AI queries and cloud sync.
            </p>
          </motion.div>
          {!!error && (
            <div
              className="
              flex items-center gap-2 text-sm text-muted-foreground
            "
            >
              <RiErrorWarningLine className="size-4 text-destructive" />
              {error.message}
            </div>
          )}
        </div>
        <motion.div
          className="
            mx-auto mt-auto w-full max-w-md pt-10 will-change-transform
          "
          initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' }}
          animate={{ opacity: 1, transform: 'translateY(0)', filter: 'none' }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button className="w-full" variant="secondary">
            Continue without an account
            <Badge variant="secondary" className="ml-1">
              Soon
            </Badge>
          </Button>
        </motion.div>
      </div>
    </>
  )
}
