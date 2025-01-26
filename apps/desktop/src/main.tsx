import type { Session } from 'better-auth'
import { QueryClient } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { initEvents } from './lib/events'
import { sleep } from './lib/helpers'
import { sessionQuery } from './queries/auth'
import { routeTree } from './routeTree.gen'
import '@connnect/ui/globals.css'

initEvents()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      networkMode: 'offlineFirst',
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    session: null as Session | null,
  },
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = createRoot(document.getElementById('root')!)
const logo = document.getElementById('logo')!

queryClient
  .ensureQueryData(sessionQuery)
  .then(async ({ data }) => {
    logo.classList.add('scale-[0.5]', 'opacity-0')
    // Waiting animation to smooth transition
    await sleep(80)
    root.render(
      <RouterProvider
        router={router}
        context={{ session: data?.session || null }}
      />,
    )
  })
