import { createRouter } from '@tanstack/react-router'

import { RoutePending } from './components/route-pending'
import { routeTree } from './routeTree.gen'

const PENDING_DELAY_MS = 150

export const getRouter = () =>
  createRouter({
    defaultPendingComponent: RoutePending,
    defaultPendingMinMs: 0,
    defaultPendingMs: PENDING_DELAY_MS,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  })

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
