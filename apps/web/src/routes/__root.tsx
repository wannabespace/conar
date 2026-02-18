import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@conar/ui/components/sonner'
import appCss from '@conar/ui/globals.css?url'
import { cn } from '@conar/ui/lib/utils'
import { ThemeObserver } from '@conar/ui/theme-observer'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { SEO } from '~/constants'
import { ErrorPage } from '~/error-page'
import { seo } from '~/utils/seo'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className={cn(`
        bg-gray-100
        dark:bg-neutral-950
      `)}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeObserver />
          <Outlet />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </QueryClientProvider>
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
