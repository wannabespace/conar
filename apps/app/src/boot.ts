import { THEME_STORAGE_KEY } from '@tamery/ui/theme-constants'

import {
  connectionResourceStoreKey,
  LAST_LOCATION_KEY,
  NAVIGATOR_OPEN_KEY,
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

document.documentElement.classList.add(
  ...Object.entries(classes)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
)
