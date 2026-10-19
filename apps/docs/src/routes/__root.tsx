import { Button } from '@tamery/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { Toaster } from '@tamery/ui/components/sonner'
import { TooltipProvider } from '@tamery/ui/components/tooltip'
import { ThemeObserver } from '@tamery/ui/theme-observer'
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'

import { ErrorPage } from '~/error-page'

import appCss from '@tamery/ui/globals.css?url'

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
      <Toaster />
      <Scripts />
    </body>
  </html>
)

const NotFound = () => (
  <main className="flex min-h-dvh items-center justify-center p-4">
    <Empty className="w-full max-w-md">
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>That page is not in the docs.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link to="/" />}>Docs home</Button>
      </EmptyContent>
    </Empty>
  </main>
)

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorPage,
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
      { href: '/site.webmanifest', rel: 'manifest' },
    ],
    meta: [
      { charSet: 'utf-8' },
      { content: 'width=device-width, initial-scale=1', name: 'viewport' },
      { content: '#0a0a0a', name: 'theme-color' },
    ],
  }),
  notFoundComponent: NotFound,
})
