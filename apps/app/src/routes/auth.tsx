import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { challenge } from '@tamery/shared/utils/challenge'
import { title } from '@tamery/shared/utils/title'
import { Badge } from '@tamery/ui/components/badge'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { AppLogoMotion } from '@tamery/ui/components/brand/app-logo.motion'
import { Button } from '@tamery/ui/components/button'
import { DitherBackground } from '@tamery/ui/components/custom/dither-background'
import { skipToken, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { TitleBar } from '~/components/title-bar'
import {
  authClient,
  bearerToken,
  isSignedIn,
  successAuthToast,
} from '~/lib/auth'
import { lastLocationStorageValue } from '~/lib/last-location'
import { orpc } from '~/lib/orpc'
import { router } from '~/main'

const signInUrl = (type: 'web' | 'desktop') => {
  const verifier = challenge.noble.generateVerifier()
  const codeChallenge = challenge.noble.generateCode(verifier)

  return {
    verifier,
    codeChallenge,
    url: `${import.meta.env.VITE_PUBLIC_MAIN_URL}/deep/sign-in?codeChallenge=${codeChallenge}&type=${type}`,
  }
}

const SHADER_MOUNT_DELAY = 700

const AuthSidePanel = () => {
  const [isShaderMounted, setIsShaderMounted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(
      () => setIsShaderMounted(true),
      SHADER_MOUNT_DELAY
    )

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="bg-body text-foreground relative hidden flex-col overflow-hidden border-r p-10 lg:flex">
      {isShaderMounted && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <DitherBackground />
        </motion.div>
      )}
      <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
        <AppLogo className="size-6" />
        Tamery
      </div>
      <blockquote className="relative z-20 mt-auto leading-normal text-balance">
        Write queries, explore data, and manage your databases with AI doing the
        heavy lifting.
      </blockquote>
    </div>
  )
}

const AuthPage = () => {
  const { refetch } = authClient.useSession()
  const [verifier, setVerifier] = useState<string | null>(null)
  const [codeChallenge, setCodeChallenge] = useState<string | null>(null)

  const signInWithChallenge = () => {
    const {
      verifier: nextVerifier,
      codeChallenge: nextCodeChallenge,
      url,
    } = signInUrl(window.electron ? 'desktop' : 'web')

    setVerifier(nextVerifier)
    setCodeChallenge(nextCodeChallenge)

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
    })
  )

  const { mutate: exchange } = useMutation(
    orpc.account.challenge.exchange.mutationOptions({
      onSuccess: async (exchangeData) => {
        bearerToken.set(exchangeData.token)
        await refetch()
        router.navigate({ href: lastLocationStorageValue.get() ?? '/' })
        successAuthToast(!!exchangeData.newUser)
      },
    })
  )

  useEffect(() => {
    if (!data?.ready || !codeChallenge || !verifier) {
      return
    }

    exchange({ codeChallenge, verifier, type: 'noble' })
  }, [data, exchange, codeChallenge, verifier])

  return (
    <>
      {window.electron && <TitleBar className="-mb-10" />}
      <div className="relative grid flex-1 overflow-hidden lg:grid-cols-2">
        <AuthSidePanel />
        <div className="relative flex flex-col overflow-hidden px-4 py-6">
          <div className="relative m-auto flex w-full max-w-87.5 flex-1 flex-col justify-center">
            <motion.div
              className="bg-primary relative mb-8 flex size-12 items-center justify-center rounded-2xl will-change-transform"
              initial={{
                opacity: 0,
                transform: 'translateY(10px)',
                filter: 'blur(4px)',
              }}
              animate={{
                opacity: 1,
                transform: 'translateY(0)',
                filter: 'none',
              }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <AppLogoMotion
                className="size-8.5 text-white will-change-transform"
                initial={{ rotate: 60 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 3, delay: 0.6, type: 'spring' }}
              />
            </motion.div>
            <motion.div
              className="will-change-transform"
              initial={{
                opacity: 0,
                transform: 'translateY(10px)',
                filter: 'blur(4px)',
              }}
              animate={{
                opacity: 1,
                transform: 'translateY(0)',
                filter: 'none',
              }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                Sign in to continue
              </h1>
              <p className="text-muted-foreground mt-2 mb-8">
                Sync your connections, queries, and chats across every device.
              </p>
            </motion.div>
            <motion.div
              className="will-change-transform"
              initial={{
                opacity: 0,
                transform: 'translateY(10px)',
                filter: 'blur(4px)',
              }}
              animate={{
                opacity: 1,
                transform: 'translateY(0)',
                filter: 'none',
              }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Button
                className="mb-2 w-full"
                size="lg"
                onClick={() => signInWithChallenge()}
              >
                {!!codeChallenge && isPending ? (
                  <span className="animate-pulse">Waiting for sign in...</span>
                ) : (
                  'Sign In'
                )}
              </Button>
              <p className="text-muted-foreground mb-4 text-center text-xs">
                Sign-in unlocks AI and cloud sync.
              </p>
            </motion.div>
            {!!error && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  strokeWidth={2}
                  className="text-destructive size-4"
                />
                {error.message}
              </div>
            )}
          </div>
          <motion.div
            className="relative mx-auto mt-auto w-full max-w-87.5 pt-10 will-change-transform"
            initial={{
              opacity: 0,
              transform: 'translateY(10px)',
              filter: 'blur(4px)',
            }}
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
      </div>
    </>
  )
}

export const Route = createFileRoute('/auth')({
  component: AuthPage,
  head: () => ({
    meta: [{ title: title('Sign in') }],
  }),
  beforeLoad: async () => {
    // Desktop waits here for the challenge handoff; web has nothing to wait for
    if (window.electron) {
      return
    }

    if (await isSignedIn()) {
      throw redirect({ to: '/' })
    }

    throw redirect({ href: signInUrl('web').url })
  },
})
