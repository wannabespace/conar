import { Store } from '@tanstack/react-store'

export type ResolvedTheme = 'dark' | 'light'
export type Theme = ResolvedTheme | 'system'

export interface ThemeStoreState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  storageKey: string
}

const isBrowser = typeof window !== 'undefined'

let themeStore: Store<ThemeStoreState>

const mediaQuery = isBrowser ? window.matchMedia('(prefers-color-scheme: dark)') : null

function updateTheme() {
  if (!mediaQuery)
    return

  const { theme } = themeStore.state

  const root = window.document.documentElement

  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = mediaQuery.matches ? 'dark' : 'light'
    themeStore.setState(state => ({ ...state, resolvedTheme: systemTheme } satisfies typeof state))
    root.classList.add(systemTheme)
    return
  }

  themeStore.setState(state => ({ ...state, resolvedTheme: theme as ResolvedTheme } satisfies typeof state))
  root.classList.add(theme)
}

if (mediaQuery) {
  mediaQuery.addEventListener('change', updateTheme)
}

export function getThemeStore() {
  return themeStore
}

export function setTheme(newTheme: Theme) {
  localStorage.setItem(themeStore.state.storageKey, newTheme)
  themeStore.setState(state => ({ ...state, theme: newTheme } satisfies typeof state))
}

export function initThemeStore(defaultTheme: Theme, storageKey: string) {
  if (!themeStore) {
    themeStore = new Store<ThemeStoreState>({
      theme: (isBrowser && (localStorage.getItem(storageKey) as Theme)) || defaultTheme,
      resolvedTheme: 'light',
      storageKey,
    })

    if (isBrowser) {
      themeStore.subscribe(({ prevVal, currentVal }) => {
        if (prevVal.theme !== currentVal.theme) {
          updateTheme()
        }
      })
    }
    updateTheme()
  }
}
