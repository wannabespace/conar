import '@tamery/shared/arktype-config'
import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'
import { handleError } from './utils/error'

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
    defaultPendingMinMs: 0,
    routeTree,
    scrollRestoration: true,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
