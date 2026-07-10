import { title } from '@conar/shared/utils/title'
import { Toaster } from '@conar/ui/components/sonner'
import { TooltipProvider } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useHotkey } from '@tanstack/react-hotkeys'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRoute, HeadContent, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { GlobalBanner } from '~/components/global-banner'
import { ErrorPage } from '~/error-page'
import { globalHooks } from '~/global-hooks'
import { queryClient } from '~/main'
import { useDeepLinksObserver } from '~/use-deep-links-observer'
import { useUpdatesObserver } from '~/use-updates-observer'

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: ErrorPage,
  head: () => ({
    meta: [{ title: title() }],
  }),
})

function RootDocument() {
  const router = useRouter()

  if (window.electron) {
    // eslint-disable-next-line react/rules-of-hooks
    useHotkey('Mod+R', () => globalHooks.callHook('refreshPressed'))
    // eslint-disable-next-line react/rules-of-hooks
    useHotkey('Mod+Shift+R', () => location.reload())
    // eslint-disable-next-line react/rules-of-hooks
    useDeepLinksObserver()
  }

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
              // For simple page layouts, we want outlet to be the full height of the screen
              '*:last:h-full *:last:min-h-[inherit] *:last:flex-1',
            )}
          >
            <GlobalBanner />
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
