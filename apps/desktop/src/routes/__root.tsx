import type { Session } from 'better-auth'
import { Toaster } from '@connnect/ui/components/sonner'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AnimatePresence } from 'motion/react'
import { AppProvider } from '~/app-provider'
import { EventsProvider } from '~/lib/events'
import { queryClient } from '~/main'
import { UpdatesProvider } from '~/updates-provider'

export const Route = createRootRouteWithContext<{ session: Session | null }>()({
  component: RootDocument,
})

function RootDocument() {
  return (
    <EventsProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <UpdatesProvider>
            <AppProvider>
              <AnimatePresence>
                <Outlet />
              </AnimatePresence>
              <Toaster />
            </AppProvider>
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
