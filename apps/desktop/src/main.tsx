import { QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { handleError } from './lib/error'
import { initEvents } from './lib/events'
import { routeTree } from './routeTree.gen'
import './monaco-worker'
import '@connnect/ui/globals.css'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: false,
    })
  })
}

window.electron.app.onDeepLink(async (url) => {
  window.initialDeepLink = url
})

initEvents()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      throwOnError: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: handleError,
    },
  },
})

const router = createRouter({
  history: createHashHistory(),
  routeTree,
  defaultPreload: 'intent',
  defaultPendingMinMs: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = createRoot(document.getElementById('root')!)

root.render(<RouterProvider router={router} />)
