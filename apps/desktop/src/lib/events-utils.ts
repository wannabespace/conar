import posthog from 'posthog-js'

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
