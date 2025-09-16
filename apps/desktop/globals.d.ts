import type { ElectronPreload } from './electron/preload'

declare global {
  interface Window {
    electron?: ElectronPreload
    initialDeepLink?: string | null
  }
}
