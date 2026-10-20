import { MutationCache, QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { posthog } from './lib/posthog'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    mutationCache: new MutationCache({
      onSettled: (_data, error, _variables, _context, mutation) => {
        if (mutation.meta?.event) {
          void posthog.capture(mutation.meta.event, { success: !error })
        }
      },
    }),
  })
  const router = createRouter({
    context: { queryClient },
    defaultPreload: 'intent',
    // TanStack Query owns data freshness; the router must not serve its own cached loader results.
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  })

  setupRouterSsrQueryIntegration({ queryClient, router })

  return router
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { event?: string }
  }
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
