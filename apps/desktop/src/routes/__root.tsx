import type { Session } from 'better-auth'
import { Toaster } from '@connnect/ui/components/sonner'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { AppProvider } from '~/app-provider'
import { EventsProvider } from '~/lib/events'
import { clientConfig, trpcReact } from '~/lib/trpc'
import { queryClient } from '~/main'
import { UpdatesProvider } from '~/updates-provider'

export const Route = createRootRouteWithContext<{ session: Session | null }>()({
  component: RootDocument,
  // beforeLoad: ({ location, context }) => {
  //   if (!context.session && !['/sign-up', '/sign-in', '/two-factor'].includes(location.pathname)) {
  //     throw redirect({ to: '/sign-up' })
  //   }
  // },
})

function RootDocument() {
  const [trpcClient] = useState(() => trpcReact.createClient(clientConfig))
  const { Provider: TRPCClientProvider } = trpcReact

  return (
    <EventsProvider>
      <ThemeProvider>
        <TRPCClientProvider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <UpdatesProvider>
                <AnimatePresence>
                  <Outlet />
                </AnimatePresence>
                <Toaster />
              </UpdatesProvider>
            </AppProvider>
            {import.meta.env.DEV && (
              <>
                <TanStackRouterDevtools />
                <ReactQueryDevtools initialIsOpen={false} />
              </>
            )}
          </QueryClientProvider>
        </TRPCClientProvider>
      </ThemeProvider>
    </EventsProvider>
  )
}
