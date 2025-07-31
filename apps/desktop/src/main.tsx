import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { runMigrations } from './drizzle'
import { handleError } from './lib/error'
import { initEvents } from './lib/events'
import { routeTree } from './routeTree.gen'
import './monaco-worker'
import './assets/styles.css'
import '@conar/ui/globals.css'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
}

window.electron?.app.onDeepLink(async (url) => {
  window.initialDeepLink = url
})

initEvents()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      throwOnError: true,
      staleTime: Number.POSITIVE_INFINITY,
      placeholderData: keepPreviousData,
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

runMigrations().then(() => root.render(<RouterProvider router={router} />))
