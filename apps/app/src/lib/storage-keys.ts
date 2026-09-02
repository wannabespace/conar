export { THEME_STORAGE_KEY as THEME_KEY } from '@tamery/ui/theme-constants'

export const LAST_LOCATION_KEY = 'last-location'
export const NAVIGATOR_WIDTH_KEY = 'navigator-width'
export const NAVIGATOR_OPEN_KEY = 'navigator-open'

export const SIDEBAR_MIN_WIDTH = 180
export const SIDEBAR_MAX_WIDTH = 420
export const SIDEBAR_DEFAULT_WIDTH = 256

export const CHAT_WIDTH_KEY = 'chat-width'
export const CHAT_DEFAULT_WIDTH = 380

export const LOGGER_HEIGHT_KEY = 'logger-height'
export const LOGGER_DEFAULT_HEIGHT = 240

export const connectionResourceStoreKey = (resourceId: string) =>
  `connection-resource-store-${resourceId}`
