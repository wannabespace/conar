import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { httpBatchLink } from '@trpc/react-query'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import SuperJSON from 'superjson'
import { AuthProvider } from '~/auth-provider'
import { env } from '~/env'
import { queryClient } from '~/main'
import { sessionQuery } from '~/queries/auth'
import { trpc } from '~/trpc'

export const Route = createRootRoute({
  component: RootDocument,
  beforeLoad: async () => {
    await queryClient.ensureQueryData(sessionQuery)
  },
})

function RootDocument() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: SuperJSON,
      links: [
        httpBatchLink({
          url: `${env.VITE_PUBLIC_APP_URL}/api/trpc`,
        }),
      ],
    }),
  )
  const { Provider: TRPCClientProvider } = trpc

  return (
    <ThemeProvider>
      <TRPCClientProvider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AnimatePresence>
              <Outlet />
            </AnimatePresence>
            {import.meta.env.DEV && (
              <>
                <TanStackRouterDevtools />
                <ReactQueryDevtools initialIsOpen={false} />
              </>
            )}
          </AuthProvider>
        </QueryClientProvider>
      </TRPCClientProvider>
    </ThemeProvider>
  )
}
