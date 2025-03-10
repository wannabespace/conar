import { QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { databasesQuery, fetchDatabases } from './entities/database'
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
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = createRoot(document.getElementById('root')!)
const preloader = document.getElementById('preloader')!

queryClient
  .ensureQueryData(sessionQuery())
  .then(async (session) => {
    if (session.data) {
      await queryClient.prefetchQuery(databasesQuery())
      fetchDatabases()
    }
    preloader.classList.add('scale-[0.5]', 'opacity-0')
    // Waiting animation to smooth transition
    await sleep(80)
    document.body.classList.remove('overflow-hidden')
    root.render(<RouterProvider router={router} />)
    await sleep(1000)
    preloader.remove()
  })
