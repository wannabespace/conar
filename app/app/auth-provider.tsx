'use client'

import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { env } from '~/env'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'
import { BEARER_TOKEN_KEY } from '~/lib/constants'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refetch } = useSession()

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', () => refetch())
  }, [])

  useEffect(() => {
    if (env.NEXT_PUBLIC_IS_DESKTOP) {
      onOpenUrl(async ([url]) => {
        const [, token] = (url || '').split('session?token=')

        if (token) {
          // eslint-disable-next-line no-alert
          alert(token)
          localStorage.setItem(BEARER_TOKEN_KEY, token)
          await refetch()
        }
      })
    }
  }, [])

  return (
    <>
      {children}
    </>
  )
}
