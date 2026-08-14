import { title } from '@tamery/shared/utils/title'
import { Toaster } from '@tamery/ui/components/sonner'
import { TooltipProvider } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useHotkey } from '@tanstack/react-hotkeys'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { ErrorPage } from '~/error-page'
import { globalHooks } from '~/global-hooks'
import { queryClient } from '~/main'
import { useDeepLinksObserver } from '~/use-deep-links-observer'
import { useUpdatesObserver } from '~/use-updates-observer'
import { useWindowFocusObserver } from '~/use-window-focus-observer'

const isElectron = !!window.electron

const RootDocument = () => {
  const router = useRouter()

  useHotkey('Mod+R', () => globalHooks.callHook('refreshPressed'), {
    enabled: isElectron,
  })
  useHotkey('Mod+Shift+R', () => location.reload(), {
    enabled: isElectron,
  })
  useDeepLinksObserver()
  useWindowFocusObserver()

  useHotkey('Mod+S', () => globalHooks.callHook('savePressed'))

  useUpdatesObserver()

  return (
    <>
      <HeadContent />
      <TooltipProvider>
        <ThemeObserver />
        <QueryClientProvider client={queryClient}>
          <div
            className={cn(
              'flex h-screen flex-col',
              '*:last:min-h-0 *:last:flex-1'
            )}
          >
            <Outlet />
          </div>
          {import.meta.env.DEV && (
            <TanStackDevtools
              plugins={[
                {
                  name: 'TanStack Query',
                  render: <ReactQueryDevtoolsPanel />,
                },
                {
                  name: 'TanStack Router',
                  render: <TanStackRouterDevtoolsPanel router={router} />,
                },
              ]}
            />
          )}
        </QueryClientProvider>
        <Toaster />
      </TooltipProvider>
    </>
  )
}

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: ErrorPage,
  head: () => ({
    meta: [{ title: title() }],
  }),
})
