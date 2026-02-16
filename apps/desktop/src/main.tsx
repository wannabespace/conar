/* eslint-disable perfectionist/sort-imports */
import '@conar/shared/arktype-config'
import { useHotkey } from '@tanstack/react-hotkeys'
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

function AppWithHotkeys() {
  useHotkey('Mod+R', e => e.preventDefault(), { ignoreInputs: false })
  useHotkey('F5', e => e.preventDefault(), { ignoreInputs: false })

  return <RouterProvider router={router} />
}

runMigrations().then(async () => {
  await Promise.all([
    connectionsCollection.stateWhenReady(),
    chatsCollection.stateWhenReady(),
  ])
  root.render(<AppWithHotkeys />)
})

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload()
  })
}
