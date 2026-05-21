import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { authClient } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { data } = authClient.useSession()

  const userId = data?.user?.id

  useEffect(() => {
    if (userId) {
      if (window.electron) {
        window.electron.versions.app().then((appVersion) => {
          posthog.identify(userId, { appVersion })
        })
      }
      else {
        posthog.identify(userId)
      }
    }
    else {
      posthog.reset()
    }
  }, [userId])

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  )
}
