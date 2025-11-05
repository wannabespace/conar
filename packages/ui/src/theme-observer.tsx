import { Store, useStore } from '@tanstack/react-store'
import { FunctionOnce } from './lib/function-once'

export type ResolvedTheme = 'dark' | 'light'
export type Theme = ResolvedTheme | 'system'

interface ThemeObserverProps {
  defaultTheme?: Theme
  storageKey?: string
}

const isBrowser = typeof window !== 'undefined'

interface ThemeStoreState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  storageKey: string
}

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

export function ThemeObserver({
  defaultTheme = 'system',
  storageKey = 'conar.theme',
}: ThemeObserverProps) {
  if (!themeStore) {
    // eslint-disable-next-line react-hooks/globals
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

  return (
    <FunctionOnce param={storageKey}>
      {(storageKey) => {
        const theme: string | null = localStorage.getItem(storageKey)

        if (
          theme === 'dark'
          || (
            (theme === null || theme === 'system')
            && window.matchMedia('(prefers-color-scheme: dark)').matches
          )
        ) {
          document.documentElement.classList.add('dark')
        }
      }}
    </FunctionOnce>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const store = useStore(themeStore)

  return {
    theme: store.theme,
    resolvedTheme: store.resolvedTheme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(store.storageKey, newTheme)
      themeStore.setState(state => ({ ...state, theme: newTheme } satisfies typeof state))
    },
  }
}
