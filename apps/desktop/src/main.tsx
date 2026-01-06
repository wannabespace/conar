/* eslint-disable perfectionist/sort-imports */
import '@conar/shared/arktype-config'
import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createBrowserHistory, createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { runMigrations } from './drizzle'
import { chatsCollection } from './entities/chat/sync'
import { databasesCollection } from './entities/database/sync'
import { handleError } from './lib/error'
import { initEvents } from './lib/events'
import { routeTree } from './routeTree.gen'
import './monaco-worker'
import './assets/styles.css'
import '@conar/ui/globals.css'
import { toast } from 'sonner'

if (import.meta.env.DEV && !import.meta.env.VITE_TEST) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
  import('react-grab')
}

window.electron?.app.onDeepLink(async (url) => {
  window.initialDeepLink = url
})

window.electron?.app.onSendToast(({ message, type }) => {
  toast[type](message, {
    id: `${type}-${message}`,
    position: 'bottom-center',
  })
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

export const subscriptionQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: 'always',
      placeholderData: keepPreviousData,
    },
    mutations: {
      onError: handleError,
    },
  },
})

// Native trigger don't work for some reason, so we need to use this workaround
window.addEventListener('focus', () => {
  subscriptionQueryClient.refetchQueries()
})

export const router = createRouter({
  history: import.meta.env.VITE_TEST ? createBrowserHistory() : createHashHistory(),
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

runMigrations().then(async () => {
  await Promise.all([
    databasesCollection.stateWhenReady(),
    chatsCollection.stateWhenReady(),
  ])
  root.render(<RouterProvider router={router} />)
})

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload()
  })
}
