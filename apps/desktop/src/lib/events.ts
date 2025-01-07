import posthog from 'posthog-js'
import { env } from '~/env'

export function initPosthog() {
  if (import.meta.env.DEV) {
    return
  }

  posthog.init(env.VITE_PUBLIC_POSTHOG_API_KEY, {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
  })
}

export function trackEvent(event: string, properties: Record<string, unknown>) {
  posthog.capture(event, properties)
}
