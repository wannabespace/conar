import { generateCodeChallenge, generateVerifier } from '@conar/shared/utils/challenge'
import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { RiErrorWarningLine } from '@remixicon/react'
import { skipToken, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { authClient, bearerToken, successAuthToast } from '~/lib/auth'
import { orpcQuery } from '~/lib/orpc'

const AppLogoSquareMotion = motion.create(AppLogoSquare)
const ButtonMotion = motion.create(Button)

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const { refetch } = authClient.useSession()
  const [verifier, setVerifier] = useState<string | null>(null)
  const [codeChallenge, setCodeChallenge] = useState<string | null>(null)

  const signInWithChallenge = async () => {
    const verifier = generateVerifier()
    const codeChallenge = await generateCodeChallenge(verifier)
    setVerifier(verifier)
    setCodeChallenge(codeChallenge)
    window.open(`${import.meta.env.VITE_PUBLIC_WEB_URL}/deep/sign-in?codeChallenge=${codeChallenge}`, '_blank')
  }

  const { data, error, isPending } = useQuery(orpcQuery.account.challenge.listen.experimental_liveOptions({
    input: codeChallenge ? { codeChallenge } : skipToken,
    throwOnError: false,
  }))
  const { mutate: exchange } = useMutation(orpcQuery.account.challenge.exchange.mutationOptions({
    onSuccess: (data) => {
      bearerToken.set(data.token)
      refetch()
      successAuthToast(!!data.newUser)
    },
  }))

  useEffect(() => {
    if (!data?.ready || !codeChallenge || !verifier) {
      return
    }

    exchange({ codeChallenge, verifier })
  }, [data, exchange, codeChallenge, verifier])

  return (
    <div className="flex flex-col bg-background px-4 py-6">
      <div className={`
        m-auto flex w-full max-w-md flex-1 flex-col justify-center
      `}
      >
        <AppLogoSquareMotion
          className="mb-8 size-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.h1
          className="text-2xl font-medium tracking-tighter text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.23 }}
        >
          Conar
        </motion.h1>
        <motion.p
          className="mb-8 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.26 }}
        >
          Start managing your data
        </motion.p>
        <ButtonMotion
          className="mb-4 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.29 }}
          onClick={() => signInWithChallenge()}
        >
          {!!codeChallenge && isPending
            ? <span className="animate-pulse">Waiting for sign in...</span>
            : 'Sign In'}
        </ButtonMotion>
        <motion.p
          className="mb-4 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.33 }}
        >
          Conar requires authentication to use AI features and cloud sync.
        </motion.p>
        <AnimatePresence mode="popLayout">
          {!!error && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <RiErrorWarningLine className="size-4 text-destructive" />
              {error.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        className="mx-auto mt-auto w-full max-w-md pt-10"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay: 0.4, type: 'spring' }}
      >
        <ButtonMotion
          className="w-full"
          variant="outline"
          disabled
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.5, delay: 0.32 }}
        >
          Anonymous Sign In (soon)
        </ButtonMotion>
      </motion.div>
    </div>
  )
}
