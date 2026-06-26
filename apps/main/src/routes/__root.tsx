import type { QueryClient } from '@tanstack/react-query'
import { SOCIAL_LINKS } from '@tamery/shared/constants'
import { Toaster } from '@tamery/ui/components/sonner'
import { TooltipProvider } from '@tamery/ui/components/tooltip'
import appCss from '@tamery/ui/globals.css?url'
import { cn } from '@tamery/ui/lib/utils'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { SEO } from '~/constants'
import { ErrorPage } from '~/error-page'
import { seo, SITE_URL } from '~/utils/seo'

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      'name': 'Tamery',
      'url': SITE_URL,
      'image': `${SITE_URL}/og-image.png`,
      'description': SEO.description,
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'macOS, Windows, Linux',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'sameAs': [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.TWITTER, SOCIAL_LINKS.DISCORD],
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      'name': 'Tamery',
      'url': SITE_URL,
      'logo': `${SITE_URL}/logo.png`,
      'sameAs': [SOCIAL_LINKS.GITHUB, SOCIAL_LINKS.TWITTER, SOCIAL_LINKS.DISCORD],
    },
  ],
}

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan()
  })
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => {
    const { meta, links } = seo({
      title: `Tamery - ${SEO.title}`,
      description: SEO.description,
      image: '/og-image.png',
      path: '/',
    })

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        ...meta,
        { name: 'apple-mobile-web-app-title', content: 'Tamery' },
        { name: 'theme-color', content: '#0a0a0a' },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
        ...links,
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(structuredData),
        },
        ...(import.meta.env.DEV
          ? []
          : [{
              defer: true,
              src: 'https://assets.onedollarstats.com/stonks.js',
            }]),
      ],
    }
  },
  component: RootComponent,
  errorComponent: props => <ErrorPage {...props} />,
})

// eslint-disable-next-line react-refresh/only-export-components
function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className={cn(`
        relative bg-gray-100
        dark:bg-neutral-950
      `)}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ThemeObserver />
            <Outlet />
          </TooltipProvider>
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </QueryClientProvider>
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
