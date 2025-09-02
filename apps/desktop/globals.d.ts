import type { ElectronPreload } from './src/preload'

declare global {
  interface Window {
    electron?: ElectronPreload
    initialDeepLink?: string | null
  }
}
