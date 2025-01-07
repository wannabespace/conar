import { QueryClient } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { initPosthog } from './lib/events'
import { routeTree } from './routeTree.gen'
import '@connnect/ui/globals.css'

initPosthog()

export const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = createRoot(document.getElementById('app')!)

root.render(<RouterProvider router={router} />)
