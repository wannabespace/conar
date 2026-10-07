import { type } from 'arktype'
import type { PostHog } from 'posthog-js'
import { createWebStorageValue } from 'seitu/web'

export const ANALYTICS_STORAGE_KEY = 'analytics-enabled'

export const analyticsStore = createWebStorageValue({
  defaultValue: true,
  key: ANALYTICS_STORAGE_KEY,
  schema: type('boolean'),
  type: 'localStorage',
})

const init = async () => {
  const { default: posthogJs } = await import('posthog-js')

  const client = posthogJs.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-mask]',
    },
  })
  // Autocapture and session recording run inside the loaded client, so turning analytics off must opt it out, not just stop our own calls. Applied once too: the choice may have changed during the import, and PostHog persists an opt-out across reloads.
  const apply = (isEnabled: boolean) => {
    if (isEnabled) {
      client.opt_in_capturing({ captureEventName: false })
    } else {
      client.opt_out_capturing()
    }
  }
  apply(analyticsStore.get())
  analyticsStore.subscribe(apply)
  return client
}

let instance: Promise<PostHog> | null = null

const withClient = async (run: (client: PostHog) => void) => {
  if (analyticsStore.get()) {
    run(await (instance ??= init()))
  }
}

export const posthog = {
  capture: (...args: Parameters<PostHog['capture']>) =>
    withClient((client) => client.capture(...args)),
  captureException: (...args: Parameters<PostHog['captureException']>) =>
    withClient((client) => client.captureException(...args)),
  identify: (...args: Parameters<PostHog['identify']>) =>
    withClient((client) => client.identify(...args)),
  reset: (...args: Parameters<PostHog['reset']>) =>
    withClient((client) => client.reset(...args)),
}
