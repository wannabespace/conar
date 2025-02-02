import type { Session } from 'better-auth'
import { QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { handleError } from './lib/error'
import { initEvents } from './lib/events'
import { sleep } from './lib/helpers'
import { sessionQuery } from './queries/auth'
import { routeTree } from './routeTree.gen'
import '@connnect/ui/globals.css'
import './monaco-worker'

window.electron.app.onDeepLink(async (url) => {
  window.initialDeepLink = url
})

initEvents()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
    mutations: {
      onError: handleError,
    },
  },
})

const router = createRouter({
  routeTree,
  history: createHashHistory(),
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

const root = document.getElementById('root')!
const preloader = document.getElementById('preloader')!

queryClient
  .ensureQueryData(sessionQuery)
  .then(async () => {
    preloader.classList.add('scale-[0.5]', 'opacity-0')
    // Waiting animation to smooth transition
    await sleep(80)
    document.body.classList.remove('overflow-hidden')
    createRoot(root).render(<RouterProvider router={router} />)
    await sleep(500)
    preloader.remove()
  })
