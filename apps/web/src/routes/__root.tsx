import { Toaster } from '@conar/ui/components/sonner'
import appCss from '@conar/ui/globals.css?url'
import { ThemeProvider } from '@conar/ui/theme-provider'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorPage } from '~/error-page'
import { seo } from '~/utils/seo'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
}

export const Route = createRootRoute({
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
        'defer': true,
        'data-domain': 'conar.app',
        'src': 'https://plausible.io/js/script.js',
      },
    ],
  }),
  component: RootComponent,
  errorComponent: props => <ErrorPage {...props} />,
})

function RootComponent() {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
