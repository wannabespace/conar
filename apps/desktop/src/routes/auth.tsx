import { generateCodeChallenge, generateVerifier } from '@conar/shared/utils/challenge'
import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { Button } from '@conar/ui/components/button'
import { RiErrorWarningLine, RiLoader3Line } from '@remixicon/react'
import { skipToken, useQuery } from '@tanstack/react-query'
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
  const [input, setInput] = useState<{ codeChallenge: string, verifier: string } | undefined>(undefined)

  const signInWithChallenge = async () => {
    const verifier = generateVerifier()
    const codeChallenge = await generateCodeChallenge(verifier)
    setInput({ codeChallenge, verifier })
    window.open(`${import.meta.env.VITE_PUBLIC_WEB_URL}/deep/sign-in?codeChallenge=${codeChallenge}`, '_blank')
  }

  const { data, error, isPending } = useQuery(orpcQuery.account.challenge.listen.experimental_liveOptions({
    input: input || skipToken,
    throwOnError: false,
  }))

  useEffect(() => {
    if (!data) {
      return
    }

    bearerToken.set(data.token)
    refetch()
    successAuthToast(!!data.newUser)
  }, [data, refetch])

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
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.h1
          className="text-2xl font-medium tracking-tighter text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.33 }}
        >
          Conar
        </motion.h1>
        <motion.p
          className="mb-8 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.36 }}
        >
          Start managing your data
        </motion.p>
        <ButtonMotion
          className="mb-2 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.39 }}
          onClick={() => signInWithChallenge()}
        >
          Sign In
        </ButtonMotion>
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
          {!!input && isPending && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <RiLoader3Line className="size-4 animate-spin" />
              We will wait until you sign in
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        className="mx-auto mt-auto w-full max-w-md pt-10"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
      >
        <Button
          className="w-full"
          variant="outline"
          disabled
        >
          Anonymous Sign In (soon)
        </Button>
      </motion.div>
    </div>
  )
}
