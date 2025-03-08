import type { ElectronPreload } from '../electron/preload'
import type { UpdatesStatus } from './updates-provider'

declare global {
  interface Window {
    electron: ElectronPreload
    initialDeepLink: string | null
    initialUpdatesStatus: UpdatesStatus | null
  }
}
