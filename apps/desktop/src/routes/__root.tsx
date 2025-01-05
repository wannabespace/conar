import { Toaster } from '@connnect/ui/components/sonner'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { useDeepLinksListener } from '~/deep-links'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'
import { queryClient } from '~/main'
import { sessionQuery } from '~/queries/auth'
import { clientConfig, trpcReact } from '~/trpc'

export const Route = createRootRoute({
  component: RootDocument,
  beforeLoad: async () => {
    await queryClient.ensureQueryData(sessionQuery)
  },
})

function RootDocument() {
  const { refetch, isAuthenticated, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', () => refetch())
  }, [])

  useEffect(() => {
    if (!isLoading) {
      router.navigate({ to: isAuthenticated ? '/' : '/sign-in' })
    }
  }, [isLoading, isAuthenticated])

  useDeepLinksListener()

  const [trpcClient] = useState(() => trpcReact.createClient(clientConfig))
  const { Provider: TRPCClientProvider } = trpcReact

  return (
    <ThemeProvider>
      <TRPCClientProvider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AnimatePresence>
            <Outlet />
          </AnimatePresence>
          {import.meta.env.DEV && (
            <>
              <TanStackRouterDevtools />
              <ReactQueryDevtools initialIsOpen={false} />
            </>
          )}
          <Toaster />
        </QueryClientProvider>
      </TRPCClientProvider>
    </ThemeProvider>
  )
}
