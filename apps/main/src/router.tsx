import '@tamery/shared/arktype-config'
import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { RoutePending } from './components/route-pending'
import { routeTree } from './routeTree.gen'
import { handleError } from './utils/error'

const PENDING_DELAY_MS = 150

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        onError: handleError,
      },
      queries: {
        placeholderData: keepPreviousData,
        retry: false,
      },
    },
  })

  const router = createRouter({
    context: {
      queryClient,
    },
    defaultPendingComponent: RoutePending,
    defaultPendingMinMs: 0,
    defaultPendingMs: PENDING_DELAY_MS,
    defaultPreload: 'intent',
    // TanStack Query owns data freshness; the router must not serve its own cached loader results.
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  })

  setupRouterSsrQueryIntegration({ queryClient, router })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
