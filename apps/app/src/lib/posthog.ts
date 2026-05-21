import posthogJs from 'posthog-js'

export const posthog = posthogJs.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-mask]',
  },
})
