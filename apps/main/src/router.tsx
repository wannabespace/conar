import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { queryClient } from '~/main'
import { routeTree } from './routeTree.gen'

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
  })

  return router
}
