import { PostHogProvider } from 'posthog-js/react'

export { identifyUser, initEvents } from './events-utils'

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
