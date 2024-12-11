'use client'

import { isTauri } from '@tauri-apps/api/core'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refetch } = useSession()

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', refetch)
  }, [])

  useEffect(() => {
    if (isTauri()) {
      onOpenUrl(async ([url]) => {
        const [, token] = (url || '').split('session?token=')

        if (token) {
          // TODO: set token in session
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
