import { title } from '@tamery/shared/title'
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
  lazyRouteComponent,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { openContextMenuOn } from '~/components/app-context-menu'
import { useWindowFocusObserver } from '~/hooks/use-window-focus-observer'
import { useWindowFullscreenObserver } from '~/hooks/use-window-fullscreen-observer'
import { globalHooks } from '~/lib/global-hooks'
import { queryClient } from '~/lib/query-client'
import { UpdatesObserver } from '~/modules/updates/updates-observer'
import { WindowTooSmall } from '~/modules/window-too-small/window-too-small'

const isElectron = !!window.electron

const RootDocument = () => {
  const router = useRouter()

  useHotkey('Mod+R', () => globalHooks.callHook('refreshPressed'), {
    enabled: isElectron,
  })
  useHotkey('Mod+Shift+R', () => location.reload(), {
    enabled: isElectron,
  })
  useWindowFocusObserver()
  useWindowFullscreenObserver()

  useHotkey('Mod+S', () => globalHooks.callHook('savePressed'))
  useHotkey('Mod+.', () => {
    const focused = document.activeElement
    const activeId = focused?.getAttribute('aria-activedescendant')
    const target = activeId
      ? document.querySelector(`#${CSS.escape(activeId)}`)
      : focused
    if (target && target !== document.body) {
      openContextMenuOn(target)
    }
  })

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
        <UpdatesObserver />
        <WindowTooSmall />
        <Toaster />
      </TooltipProvider>
    </>
  )
}

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: lazyRouteComponent(() => import('~/error-page'), 'ErrorPage'),
  head: () => ({
    meta: [{ title: title() }],
  }),
})
