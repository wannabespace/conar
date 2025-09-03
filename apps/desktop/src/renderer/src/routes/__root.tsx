import { title } from '@conar/shared/utils/title'
import { Toaster } from '@conar/ui/components/sonner'
import { ThemeProvider } from '@conar/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { AuthObserver } from '~/auth-observer'
import { enterAppAnimation } from '~/enter'
import { ErrorPage } from '~/error-page'
import { authClient } from '~/lib/auth'
import { EventsProvider } from '~/lib/events'
import { queryClient } from '~/main'
import { checkForUpdates, UpdatesObserver } from '~/updates-observer'

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: ErrorPage,
  head: () => ({
    meta: [
      {
        title: title(),
      },
    ],
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
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <UpdatesObserver />
            <AuthObserver />
            <Outlet />
            <Toaster />
            {import.meta.env.DEV && (
              <>
                <TanStackRouterDevtools position="bottom-right" />
                <ReactQueryDevtools initialIsOpen={false} />
              </>
            )}
          </QueryClientProvider>
        </ThemeProvider>
      </EventsProvider>
    </>
  )
}
