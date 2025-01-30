import type { events } from '../electron/lib/events'

declare global {
  interface Window {
    electronAPI: typeof events
  }
}
