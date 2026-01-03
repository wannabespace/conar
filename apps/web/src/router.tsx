/* eslint-disable perfectionist/sort-imports */
import '@conar/shared/arktype-config'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'
import { handleError } from './utils/error'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        onError: handleError,
      },
    },
  })

  const router = createRouter({
    routeTree,
    defaultPendingMinMs: 0,
    context: {
      queryClient,
    },
  })
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
