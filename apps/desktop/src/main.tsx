import { QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { handleError } from './lib/error'
import { initEvents } from './lib/events'
import { sleep } from './lib/helpers'
import { routeTree } from './routeTree.gen'
import '@connnect/ui/globals.css'
import './monaco-worker'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: true,
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

;(async () => {
  preloader.classList.add('scale-[0.5]', 'opacity-0')
  // Waiting animation to smooth transition
  await sleep(80)
  document.body.classList.remove('overflow-hidden')
  root.render(<RouterProvider router={router} />)
  await sleep(1000)
  preloader.remove()
})()
