import posthog from 'posthog-js'

export function initEvents() {
  if (import.meta.env.DEV)
    return null

  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_API_KEY, {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
  })
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
