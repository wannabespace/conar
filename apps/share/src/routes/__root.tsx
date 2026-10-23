import { Toaster } from '@tamery/ui/components/sonner'
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
import { useEffect } from 'react'

import { StatusPage } from '~/components/status-page'
import { posthog } from '~/lib/posthog'

import appCss from '~/styles.css?url'

const RootComponent = () => {
  useEffect(() => {
    void posthog.start()
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-body relative">
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <ThemeObserver />
            <Outlet />
            <Toaster />
          </TooltipProvider>
        </MotionConfig>
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootComponent,
    errorComponent: () => <StatusPage status="error" />,
    head: () => ({
      links: [
        { href: appCss, rel: 'stylesheet' },
        {
          href: '/favicon-96x96.png',
          rel: 'icon',
          sizes: '96x96',
          type: 'image/png',
        },
        { href: '/favicon.ico', rel: 'shortcut icon' },
        {
          href: '/apple-touch-icon.png',
          rel: 'apple-touch-icon',
          sizes: '180x180',
        },
        { href: '/site.webmanifest', rel: 'manifest' },
      ],
      meta: [
        { charSet: 'utf-8' },
        { title: 'Shared table · Tamery' },
        { content: 'width=device-width, initial-scale=1', name: 'viewport' },
      ],
    }),
    notFoundComponent: () => <StatusPage status="gone" />,
  }
)
