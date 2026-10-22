import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Suspense } from 'react'

import { ViewerButton } from './viewer-button'

export const TopBar = () => (
  <nav className="flex h-8 shrink-0 items-center justify-between px-3">
    <a
      href={import.meta.env.VITE_PUBLIC_MAIN_URL}
      aria-label="Tamery"
      className="text-foreground rounded-md p-1"
    >
      <AppLogo className="text-primary size-5" />
    </a>
    <Suspense fallback={null}>
      <ViewerButton />
    </Suspense>
  </nav>
)
