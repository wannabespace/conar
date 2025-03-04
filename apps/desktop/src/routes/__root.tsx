import { Toaster } from '@connnect/ui/components/sonner'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AnimatePresence } from 'motion/react'
import { AuthObserver } from '~/auth-observer'
import { ErrorPage } from '~/error-page'
import { EventsProvider } from '~/lib/events'
import { queryClient } from '~/main'
import { UpdatesProvider } from '~/updates-provider'

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: props => <ErrorPage {...props} />,
})

function RootDocument() {
  return (
    <EventsProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <UpdatesProvider>
            <AuthObserver />
            <AnimatePresence>
              <Outlet />
            </AnimatePresence>
            <Toaster />
            {import.meta.env.DEV && (
              <>
                <TanStackRouterDevtools />
                <ReactQueryDevtools initialIsOpen={false} />
              </>
            )}
          </UpdatesProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </EventsProvider>
  )
}
