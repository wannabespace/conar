import type * as React from 'react'
import type { ElectronPreload } from './electron/preload'

declare global {
  interface Window {
    electron?: ElectronPreload
    initialDeepLink?: string | null
  }
}

declare module 'react' {
  interface CSSProperties extends React.CSSProperties {
    [key: `--${string}`]: string | number
  }
}
