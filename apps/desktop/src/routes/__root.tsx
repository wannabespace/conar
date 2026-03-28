import { title } from '@conar/shared/utils/title'
import { Toaster } from '@conar/ui/components/sonner'
import { cn } from '@conar/ui/lib/utils'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRoute, HeadContent, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { AuthObserver } from '~/auth-observer'
import { GlobalBanner } from '~/components/global-banner'
import { enterAppAnimation } from '~/enter'
import { ErrorPage } from '~/error-page'
import { authClient } from '~/lib/auth'
import { EventsProvider } from '~/lib/events'
import { queryClient } from '~/main'
import { useDeepLinksObserver } from '~/use-deep-links-observer'
import { useUpdatesObserver } from '~/use-updates-observer'

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: ErrorPage,
  head: () => ({
    meta: [{ title: title() }],
  }),
})

function RootDocument() {
  const { isPending } = authClient.useSession()
  const router = useRouter()

  useUpdatesObserver()
  useDeepLinksObserver()

  useEffect(() => {
    if (isPending)
      return

    enterAppAnimation()
  }, [isPending])

  return (
    <>
      <HeadContent />
      <EventsProvider>
        <ThemeObserver />
        <QueryClientProvider client={queryClient}>
          <AuthObserver />
          <div className={cn(
            'flex h-screen flex-col',
            // For simple page layouts, we want outlet to be the full height of the screen
            '*:last:h-full *:last:min-h-[inherit] *:last:flex-1',
          )}
          >
            <GlobalBanner />
            <Outlet />
          </div>
          {import.meta.env.DEV && (
            <TanStackDevtools
              plugins={[
                {
                  name: 'TanStack Query',
                  render: <ReactQueryDevtoolsPanel />,
                },
                {
                  name: 'TanStack Router',
                  render: <TanStackRouterDevtoolsPanel router={router} />,
                },
              ]}
            />
          )}
        </QueryClientProvider>
        <Toaster />
      </EventsProvider>
    </>
  )
}
