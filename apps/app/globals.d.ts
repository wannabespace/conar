import type * as React from 'react'

import type { ElectronPreload } from '../desktop/src/preload/preload'

declare global {
  interface Window {
    electron?: ElectronPreload
    initialDeepLink?: string | null
  }
}

declare module 'react' {
  type CSSProperties = React.CSSProperties &
    Record<`--${string}`, string | number>
}
