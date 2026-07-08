/* eslint-disable perfectionist/sort-imports */
import '@tamery/shared/arktype-config'
import '@tamery/ui/globals.css'
import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import { createBrowserHistory, createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'
import './monaco-worker'
import { toast } from 'sonner'
import { isSignedIn } from './lib/auth'

if (import.meta.env.DEV && !import.meta.env.VITE_TEST) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
}

window.electron?.app.onDeepLink(async (url) => {
  window.initialDeepLink = url
})

window.electron?.app.onSendToast(({ message, type, description, duration }) => {
  toast[type](message, {
    id: `${type}-${message}-${description}`,
    description,
    position: 'bottom-center',
    duration,
  })
})

if (window.electron) {
  window.addEventListener('keydown', (event) => {
    if (((event.ctrlKey || event.metaKey) && event.key === 'r') || event.key === 'F5') {
      event.preventDefault()
    }
  })
}

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

export const router = createRouter({
  history: import.meta.env.VITE_TEST || !window.electron ? createBrowserHistory() : createHashHistory(),
  routeTree,
  defaultPreload: 'intent',
  defaultPendingMinMs: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

(async () => {
  const isAuthPage = router.state.location.pathname.startsWith('/auth')
  const isSigned = await isSignedIn()

  if (isAuthPage && isSigned) {
    router.navigate({ to: '/', replace: true })
  }
  else if (!isAuthPage && !isSigned && navigator.onLine) {
    router.navigate({ to: '/auth', replace: true })
  }

  const root = createRoot(document.getElementById('root')!)

  root.render(<RouterProvider router={router} />)
})()
