import type { Session } from 'better-auth'
import { Toaster } from '@connnect/ui/components/sonner'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { parse, stringify } from 'superjson'
import { AppProvider } from '~/app-provider'
import { asyncStorage } from '~/lib/async-storage'
import { EventsProvider } from '~/lib/events'
import { clientConfig, trpcReact } from '~/lib/trpc'
import { queryClient } from '~/main'

const persister = createAsyncStoragePersister({
  storage: asyncStorage,
  throttleTime: 1000,
  serialize: stringify,
  deserialize: parse,
})

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
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
            onSuccess={() => {
              queryClient.resumePausedMutations().then(() => {
                queryClient.invalidateQueries()
              })
            }}
          >
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
          </PersistQueryClientProvider>
        </TRPCClientProvider>
      </ThemeProvider>
    </EventsProvider>
  )
}
