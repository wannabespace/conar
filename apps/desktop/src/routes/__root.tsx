import { Toaster } from '@connnect/ui/components/sonner'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AnimatePresence } from 'motion/react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useState } from 'react'
import { AppProvider } from '~/app-provider'
import { clientConfig, trpcReact } from '~/lib/trpc'
import { queryClient } from '~/main'
import { sessionQuery } from '~/queries/auth'
import { UpdatesProvider } from '~/updates-provider'

export const Route = createRootRoute({
  component: RootDocument,
  beforeLoad: async () => {
    await queryClient.ensureQueryData(sessionQuery)
  },
})

function RootDocument() {
  const [trpcClient] = useState(() => trpcReact.createClient(clientConfig))
  const { Provider: TRPCClientProvider } = trpcReact

  return (
    <PostHogProvider client={posthog}>
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
    </PostHogProvider>
  )
}
