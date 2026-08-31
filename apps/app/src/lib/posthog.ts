import type { PostHog } from 'posthog-js'

const init = async () => {
  const { default: posthogJs } = await import('posthog-js')

  return posthogJs.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-mask]',
    },
  })
}

let instance: Promise<PostHog> | null = null

const load = () => (instance ??= init())

export const posthog = {
  captureException: async (
    ...args: Parameters<PostHog['captureException']>
  ) => {
    const client = await load()

    client.captureException(...args)
  },
  identify: async (...args: Parameters<PostHog['identify']>) => {
    const client = await load()

    client.identify(...args)
  },
  reset: async (...args: Parameters<PostHog['reset']>) => {
    const client = await load()

    client.reset(...args)
  },
}
