import { type } from 'arktype'
import { createComputed } from 'seitu'
import { createLocalStorageValue, createMediaQuery } from 'seitu/web'

export type ResolvedTheme = 'dark' | 'light'
export type Theme = ResolvedTheme | 'system'

export const THEME_STORAGE_KEY = 'conar.theme'

export const themeStore = createLocalStorageValue({
  key: THEME_STORAGE_KEY,
  schema: type('string' as type.cast<Theme>),
  defaultValue: 'system',
})

const mediaQuery = createMediaQuery({ query: '(prefers-color-scheme: dark)' })

export const resolvedThemeComputed = createComputed([themeStore, mediaQuery], ([theme, isDark]) => {
  if (theme === 'system') {
    return isDark ? 'dark' : 'light'
  }
  return theme
})

function toggleTheme() {
  const root = window.document.documentElement

  root.classList.value = resolvedThemeComputed.get()
}

mediaQuery.subscribe(toggleTheme)
themeStore.subscribe(toggleTheme)
