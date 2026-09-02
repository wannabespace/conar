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
  THEME_KEY,
} from './lib/storage-keys'

const parseStorage = <T>(key: string): T | undefined => {
  const raw = localStorage.getItem(key)

  try {
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

const root = document.documentElement

if (window.electron) {
  root.classList.add('electron')

  if (/Mac/iu.test(navigator.userAgent)) {
    root.classList.add('mac')
  }
}

const applyConnectionShellState = (resourceId: string) => {
  const state = parseStorage<{ chatOpened?: boolean; loggerOpened?: boolean }>(
    connectionResourceStoreKey(resourceId)
  )

  if (state?.chatOpened) {
    const chatWidth = parseStorage<number>(CHAT_WIDTH_KEY)

    root.classList.add('shell-chat')
    root.style.setProperty(
      '--shell-chat-width',
      `${typeof chatWidth === 'number' ? chatWidth : CHAT_DEFAULT_WIDTH}px`
    )
  }

  if (state?.loggerOpened) {
    const loggerHeight = parseStorage<number>(LOGGER_HEIGHT_KEY)

    root.classList.add('shell-logger')
    root.style.setProperty(
      '--shell-logger-height',
      `${typeof loggerHeight === 'number' ? loggerHeight : LOGGER_DEFAULT_HEIGHT}px`
    )
  }
}

const lastLocation = parseStorage<string>(LAST_LOCATION_KEY)

if (typeof lastLocation === 'string') {
  const resourceId = lastLocation
    .split('/connection/')[1]
    ?.split(/[/?#]/u)
    .at(0)

  root.classList.add(resourceId ? 'shell-connection' : 'shell-dashboard')

  if (resourceId) {
    applyConnectionShellState(resourceId)
  }
} else {
  root.classList.add('shell-auth')
}

if (parseStorage<boolean>(NAVIGATOR_OPEN_KEY) !== false) {
  const navigatorWidth = parseStorage<number>(NAVIGATOR_WIDTH_KEY)

  root.classList.add('shell-navigator')
  root.style.setProperty(
    '--shell-navigator-width',
    `${typeof navigatorWidth === 'number' ? navigatorWidth : SIDEBAR_DEFAULT_WIDTH}px`
  )
}

const theme = parseStorage<string>(THEME_KEY) ?? 'system'

if (
  theme === 'dark' ||
  (theme === 'system' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  root.classList.add('dark')
}
