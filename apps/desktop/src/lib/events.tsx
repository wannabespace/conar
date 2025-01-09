/* eslint-disable react-refresh/only-export-components */
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { env } from '~/env'

export function initEvents() {
  if (import.meta.env.DEV) {
    return
  }

  posthog.init(env.VITE_PUBLIC_POSTHOG_API_KEY, {
    api_host: 'https://eu.i.posthog.com',
  })
}

export function identifyUser(userId: string | null) {
  if (userId) {
    posthog.identify(userId)
  }
  else {
    posthog.reset()
  }
}

export function trackEvent(event: string, properties: Record<string, unknown>) {
  posthog.capture(event, properties)
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
