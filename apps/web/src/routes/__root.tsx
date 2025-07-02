import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@conar/ui/components/sonner'
import appCss from '@conar/ui/globals.css?url'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { ThemeProvider } from '@conar/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorPage } from '~/error-page'
import { getLatestReleaseOptions, getRepoOptions, getUsersCountOptions } from '~/queries'
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
      context.queryClient.prefetchQuery(getLatestReleaseOptions)
      context.queryClient.prefetchQuery(getUsersCountOptions)
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
        title: 'Conar.app - AI-powered connections management tool',
        description: 'AI-powered tool that makes database operations easier. Built for PostgreSQL. Modern alternative to traditional database management tools.',
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
      {
        defer: true,
        src: 'https://assets.onedollarstats.com/stonks.js',
        ...(import.meta.env.DEV ? { 'data-debug': 'conar.app' } : {}),
      },
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
      <body className="bg-gray-100 dark:bg-neutral-950">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Outlet />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </ThemeProvider>
        </QueryClientProvider>
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
