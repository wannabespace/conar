import { title } from '@conar/shared/utils/title'
import { Toaster } from '@conar/ui/components/sonner'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { AuthObserver } from '~/auth-observer'
import { enterAppAnimation } from '~/enter'
import { ErrorPage } from '~/error-page'
import { authClient } from '~/lib/auth'
import { EventsProvider } from '~/lib/events'
import { queryClient, router } from '~/main'
import { checkForUpdates, UpdatesObserver } from '~/updates-observer'

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: ErrorPage,
  head: () => ({
    meta: [{ title: title() }],
  }),
})

checkForUpdates()

function RootDocument() {
  const { isPending } = authClient.useSession()

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
          <Outlet />
          <UpdatesObserver />
          <AuthObserver />
          <Toaster />
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
      </EventsProvider>
    </>
  )
}
