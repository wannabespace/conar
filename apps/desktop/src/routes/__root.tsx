import { title } from '@conar/shared/utils/title'
import { Toaster } from '@conar/ui/components/sonner'
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { ThemeProvider } from '@conar/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AnimatePresence } from 'motion/react'
import { AuthObserver } from '~/auth-observer'
import { ErrorPage } from '~/error-page'
import { authClient } from '~/lib/auth'
import { EventsProvider } from '~/lib/events'
import { sleep } from '~/lib/helpers'
import { queryClient } from '~/main'
import { checkForUpdates, UpdatesObserver } from '~/updates-observer'

export const Route = createRootRoute({
  component: RootDocument,
  errorComponent: props => <ErrorPage {...props} />,
  head: () => ({
    meta: [
      {
        title: title(),
      },
    ],
  }),
})

checkForUpdates()

function RootDocument() {
  const { isPending } = authClient.useSession()

  useAsyncEffect(async () => {
    if (isPending)
      return

    const preloader = document.getElementById('preloader')!

    preloader.classList.add('scale-[0.6]', 'opacity-0')
    // Waiting animation to smooth transition
    await sleep(80)
    document.body.classList.remove('overflow-hidden')
  }, [isPending])

  return (
    <>
      <HeadContent />
      <EventsProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <UpdatesObserver />
            <AuthObserver />
            <AnimatePresence>
              {isPending ? null : <Outlet />}
            </AnimatePresence>
            <Toaster />
            {import.meta.env.DEV && (
              <>
                <TanStackRouterDevtools position="bottom-right" />
                <ReactQueryDevtools initialIsOpen={false} />
              </>
            )}
          </QueryClientProvider>
        </ThemeProvider>
      </EventsProvider>
    </>
  )
}
