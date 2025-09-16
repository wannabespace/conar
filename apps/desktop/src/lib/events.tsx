/* eslint-disable react-refresh/only-export-components */
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export function initEvents() {
  if (import.meta.env.DEV)
    return null
}

interface IdentifyUserProps {
  email: string
  name: string
}

export function identifyUser(userId: string, properties: IdentifyUserProps): void
export function identifyUser(userId: null, properties?: IdentifyUserProps): void
export async function identifyUser(userId: string | null, properties?: IdentifyUserProps) {
  if (userId) {
    posthog.identify(userId, { ...properties, appVersion: await window.electron?.versions.app() })
  }
  else {
    posthog.reset()
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties)
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  if (import.meta.env.DEV)
    return children

  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_API_KEY}
      options={{
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: '[data-mask]',
        },
        api_host: 'https://eu.i.posthog.com',
      }}
    >
      {children}
    </PostHogProvider>
  )
}
