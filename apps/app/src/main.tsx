import './lib/warmup'
import { themeStore } from '@tamery/ui/theme-store'
import { keepPreviousData, QueryClient } from '@tanstack/react-query'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'

import { lastLocationStorageValue } from './lib/last-location'
import { routeTree } from './routeTree.gen'

if (window.electron) {
  themeStore.subscribe((theme) => window.electron?.app.setNativeTheme(theme), {
    immediate: true,
  })
}

window.electron?.app.onDeepLink((url) => {
  window.initialDeepLink = url
})

window.electron?.app.onSendToast(({ message, type, description, duration }) => {
  toast[type](message, {
    description,
    duration,
    id: `${type}-${message}-${description}`,
    position: 'bottom-center',
  })
})

if (window.electron) {
  window.addEventListener('keydown', (event) => {
    if (
      ((event.ctrlKey || event.metaKey) && event.key === 'r') ||
      event.key === 'F5'
    ) {
      event.preventDefault()
    }
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      placeholderData: keepPreviousData,
      retry: 0,
      staleTime: Number.POSITIVE_INFINITY,
      throwOnError: true,
    },
  },
})

export const subscriptionQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: 'always',
      retry: 0,
    },
  },
})

export const router = createRouter({
  defaultPendingMinMs: 0,
  defaultPreload: 'intent',
  history:
    import.meta.env.VITE_TEST || !window.electron
      ? createBrowserHistory()
      : createHashHistory(),
  pathParamsAllowedCharacters: [':'],
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

router.subscribe('onResolved', ({ toLocation }) => {
  for (const shell of document.querySelectorAll('[data-shell]')) {
    requestAnimationFrame(() => shell.remove())
  }

  if (!toLocation.pathname.startsWith('/auth')) {
    lastLocationStorageValue.set(toLocation.href)
  }
})

const isRoutableHref = (href: string) => {
  const { pathname } = new URL(href, window.location.origin)

  return !router.matchRoutes(pathname).some((match) => match._notFound)
}

if (router.state.location.pathname === '/') {
  const lastLocation = lastLocationStorageValue.get()

  if (lastLocation && isRoutableHref(lastLocation)) {
    router.navigate({ href: lastLocation, replace: true })
  } else {
    lastLocationStorageValue.clear()
    router.navigate({ replace: true, to: '/auth' })
  }
}

const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

const root = createRoot(rootElement)

root.render(<RouterProvider router={router} />)
