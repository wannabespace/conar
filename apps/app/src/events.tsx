import posthogJs from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect, useState } from 'react'
import { authClient } from '~/lib/auth'

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { data } = authClient.useSession()
  const [posthog] = useState(() => posthogJs.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-mask]',
    },
  }))

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
  }, [userId, posthog])

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  )
}
