import { useEffect } from 'react'

import { authClient } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

export const EventsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data } = authClient.useSession()

  const userId = data?.user?.id

  useEffect(() => {
    let cancelled = false

    const identify = async () => {
      if (!userId) {
        posthog.reset()
        return
      }

      if (window.electron) {
        const appVersion = await window.electron.versions.app()
        if (!cancelled) {
          posthog.identify(userId, { appVersion })
        }
        return
      }

      posthog.identify(userId)
    }

    identify()

    return () => {
      cancelled = true
      posthog.reset()
    }
  }, [userId])

  return children
}
