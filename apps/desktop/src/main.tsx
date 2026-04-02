/* eslint-disable perfectionist/sort-imports */
import '@conar/shared/arktype-config'
import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createBrowserHistory, createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { runMigrations } from './drizzle'
import { chatsCollection } from './entities/chat/sync'
import { connectionsCollection } from './entities/connection/sync'
import { initEvents } from './lib/events-utils'
import { routeTree } from './routeTree.gen'
import './monaco-worker'
import './assets/styles.css'
import '@conar/ui/globals.css'
import { toast } from 'sonner'

if (import.meta.env.DEV && !import.meta.env.VITE_TEST) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
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

window.addEventListener('keydown', (event) => {
  if (((event.ctrlKey || event.metaKey) && event.key === 'r') || event.key === 'F5') {
    event.preventDefault()
  }
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      throwOnError: true,
      staleTime: Number.POSITIVE_INFINITY,
      placeholderData: keepPreviousData,
    },
  },
})

export const subscriptionQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: 'always',
      placeholderData: keepPreviousData,
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

runMigrations()
  // Migration from old architecture to new and rename the project
  // TODO: Remove in future
  .then(async () => {
    const dbs = await indexedDB.databases()
    const hasOldDb = dbs.some(db => db.name?.includes('conar'))

    if (!hasOldDb) {
      return
    }

    indexedDB.deleteDatabase('/pglite/conar')

    // clear local storage except for bearer token
    Object.keys(localStorage).forEach((key) => {
      if (!key.includes('bearer_token')) {
        localStorage.removeItem(key)
      }
    })

    if (localStorage.getItem('conar.bearer_token')) {
      localStorage.setItem('tamery.bearer_token', localStorage.getItem('conar.bearer_token')!)
      localStorage.removeItem('conar.bearer_token')
    }
  })
  .then(async () => {
    await Promise.all([
      connectionsCollection.stateWhenReady(),
      chatsCollection.stateWhenReady(),
    ])
    root.render(<RouterProvider router={router} />)
  })
