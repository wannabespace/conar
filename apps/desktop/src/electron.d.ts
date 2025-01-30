import type { electron } from '../electron/lib/events'

declare global {
  interface Window {
    electron: typeof electron
  }
}
