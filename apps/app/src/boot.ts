import { parseStorage } from '@tamery/ui/lib/utils'

import {
  connectionResourceStoreKey,
  LAST_LOCATION_KEY,
  NAVIGATOR_OPEN_KEY,
  THEME_KEY,
} from './lib/storage-keys'

if (window.electron) {
  document.documentElement.classList.add('electron')

  if (/Mac/iu.test(navigator.userAgent)) {
    document.documentElement.classList.add('mac')
  }
}

const applyConnectionShellState = (resourceId: string) => {
  const state = parseStorage<{ chatOpened?: boolean; loggerOpened?: boolean }>(
    connectionResourceStoreKey(resourceId)
  )

  if (state?.chatOpened) {
    document.documentElement.classList.add('shell-chat')
  }

  if (state?.loggerOpened) {
    document.documentElement.classList.add('shell-logger')
  }
}

const lastLocation = parseStorage<string>(LAST_LOCATION_KEY)

if (typeof lastLocation === 'string') {
  const resourceId = lastLocation
    .split('/connection/')[1]
    ?.split(/[/?#]/u)
    .at(0)

  document.documentElement.classList.add(
    resourceId ? 'shell-connection' : 'shell-dashboard'
  )

  if (resourceId) {
    applyConnectionShellState(resourceId)
  }
} else {
  document.documentElement.classList.add('shell-auth')
}

if (parseStorage<boolean>(NAVIGATOR_OPEN_KEY) !== false) {
  document.documentElement.classList.add('shell-navigator')
}

const theme = parseStorage<string>(THEME_KEY) ?? 'system'

if (
  theme === 'dark' ||
  (theme === 'system' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark')
}
