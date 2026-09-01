import {
  LAST_LOCATION_KEY,
  NAVIGATOR_OPEN_KEY,
  NAVIGATOR_WIDTH_KEY,
  SIDEBAR_DEFAULT_WIDTH,
  THEME_KEY,
} from './lib/storage-keys'

const read = (key: string): unknown => {
  const raw = localStorage.getItem(key)

  try {
    return raw === null ? undefined : (JSON.parse(raw) as unknown)
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

const lastLocation = read(LAST_LOCATION_KEY)

if (typeof lastLocation === 'string') {
  root.classList.add(
    lastLocation.includes('/connection/')
      ? 'shell-connection'
      : 'shell-dashboard'
  )
} else {
  root.classList.add('shell-auth')
}

const navigatorWidth = read(NAVIGATOR_WIDTH_KEY)

root.style.setProperty(
  '--shell-navigator-width',
  read(NAVIGATOR_OPEN_KEY) === false
    ? '0px'
    : `${typeof navigatorWidth === 'number' ? navigatorWidth : SIDEBAR_DEFAULT_WIDTH}px`
)

const theme = read(THEME_KEY) ?? 'system'

if (
  theme === 'dark' ||
  (theme === 'system' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  root.classList.add('dark')
}
