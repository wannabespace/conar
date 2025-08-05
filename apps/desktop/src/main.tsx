import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { createRoot } from 'react-dom/client'
import { runMigrations } from './drizzle'
import { ensureDatabases } from './entities/database'

import { handleError } from './lib/error'
import { initEvents } from './lib/events'
import { routeTree } from './routeTree.gen'
import './monaco-worker'
import './assets/styles.css'
import '@conar/ui/globals.css'

dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekOfYear)

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

runMigrations().then(() => {
  root.render(<RouterProvider router={router} />)
  ensureDatabases()
})
