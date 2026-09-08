import { THEME_STORAGE_KEY } from '@tamery/ui/theme-constants'

import {
  CHAT_DEFAULT_WIDTH,
  CHAT_WIDTH_KEY,
  connectionResourceStoreKey,
  LAST_LOCATION_KEY,
  LOGGER_DEFAULT_HEIGHT,
  LOGGER_HEIGHT_KEY,
  NAVIGATOR_OPEN_KEY,
  NAVIGATOR_WIDTH_KEY,
  SIDEBAR_DEFAULT_WIDTH,
} from './lib/constants'

const read = <T>(key: string): T | undefined => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? undefined
  } catch {
    return undefined
  }
}

const isElectron = !!window.electron
const lastLocation = read<string>(LAST_LOCATION_KEY)
const resourceId = lastLocation?.match(/\/connection\/(?<id>[^/?#]+)/u)?.groups
  ?.id
const resourceState = resourceId
  ? read<{ chatOpened?: boolean; loggerOpened?: boolean }>(
      connectionResourceStoreKey(resourceId)
    )
  : undefined
const theme = read<string>(THEME_STORAGE_KEY) ?? 'system'

const classes = {
  dark:
    theme === 'dark' ||
    (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches),
  electron: isElectron,
  mac: isElectron && /Mac/u.test(navigator.userAgent),
  'shell-auth': lastLocation === undefined,
  'shell-chat': !!resourceState?.chatOpened,
  'shell-connection': !!resourceId,
  'shell-dashboard': lastLocation !== undefined && !resourceId,
  'shell-logger': !!resourceState?.loggerOpened,
  'shell-navigator': read<boolean>(NAVIGATOR_OPEN_KEY) !== false,
}

const sizes = {
  '--shell-chat-width': read<number>(CHAT_WIDTH_KEY) ?? CHAT_DEFAULT_WIDTH,
  '--shell-logger-height':
    read<number>(LOGGER_HEIGHT_KEY) ?? LOGGER_DEFAULT_HEIGHT,
  '--shell-navigator-width':
    read<number>(NAVIGATOR_WIDTH_KEY) ?? SIDEBAR_DEFAULT_WIDTH,
}

document.documentElement.classList.add(
  ...Object.entries(classes)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
)

for (const [name, value] of Object.entries(sizes)) {
  document.documentElement.style.setProperty(name, `${value}px`)
}
