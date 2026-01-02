import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@conar/ui/components/sonner'
import appCss from '@conar/ui/globals.css?url'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { cn } from '@conar/ui/lib/utils'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { Databuddy } from '@databuddy/sdk/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { SEO } from '~/constants'
import { ErrorPage } from '~/error-page'
import { getRepoOptions } from '~/queries'
import { seo } from '~/utils/seo'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: async ({ context }) => {
    if (typeof window !== 'undefined') {
      context.queryClient.prefetchQuery(getRepoOptions)
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: `Conar.app - ${SEO.title}`,
        description: SEO.description,
        image: '/og-image.png',
      }),
      { name: 'apple-mobile-web-app-title', content: 'Conar' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'shortcut icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
    scripts: [
      ...(import.meta.env.DEV
        ? []
        : [{
            defer: true,
            src: 'https://assets.onedollarstats.com/stonks.js',
          }]),
    ],
  }),
  component: RootComponent,
  errorComponent: props => <ErrorPage {...props} />,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  const pathname = useRouterState({ select: state => state.location.pathname })

  useMountedEffect(() => {
    window.scrollTo({
      top: 0,
    })
  }, [pathname])

  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className={cn(`
        bg-gray-100
        dark:bg-neutral-950
      `)}
      >
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <ThemeObserver />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </QueryClientProvider>
        <Toaster />
        <Databuddy
          clientId="4cWwAbS06aDNledzhodgS"
          enableBatching
          disabled={import.meta.env.DEV}
        />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
