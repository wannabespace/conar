import { TooltipProvider } from '@tamery/ui/components/tooltip'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'

import { StatusPage } from '~/components/status-page'

import appCss from '~/styles.css?url'

const RootComponent = () => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <HeadContent />
    </head>
    <body className="bg-body relative">
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <ThemeObserver />
          <Outlet />
        </TooltipProvider>
      </MotionConfig>
      <Scripts />
    </body>
  </html>
)

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
    errorComponent: () => <StatusPage status="unavailable" />,
    head: () => ({
      links: [
        { href: appCss, rel: 'stylesheet' },
        {
          href: '/favicon-96x96.png',
          rel: 'icon',
          sizes: '96x96',
          type: 'image/png',
        },
        { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
        { href: '/favicon.ico', rel: 'shortcut icon' },
        {
          href: '/apple-touch-icon.png',
          rel: 'apple-touch-icon',
          sizes: '180x180',
        },
      ],
      meta: [
        { charSet: 'utf-8' },
        { title: 'Shared table · Tamery' },
        { content: 'width=device-width, initial-scale=1', name: 'viewport' },
        { content: 'noindex, nofollow', name: 'robots' },
      ],
    }),
    notFoundComponent: () => <StatusPage status="gone" />,
  }
)
