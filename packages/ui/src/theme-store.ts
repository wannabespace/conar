import { type } from 'arktype'
import { createComputed } from 'seitu'
import { useSubscription } from 'seitu/react'
import { createLocalStorageValue, createMediaQuery } from 'seitu/web'

export type ResolvedTheme = 'dark' | 'light'
export type Theme = ResolvedTheme | 'system'

export const THEME_STORAGE_KEY = 'conar.theme'

export const themeStore = createLocalStorageValue({
  key: THEME_STORAGE_KEY,
  schema: type('"dark" | "light" | "system"'),
  defaultValue: 'system',
})

const mediaQuery = createMediaQuery({ query: '(prefers-color-scheme: dark)' })

const resolvedThemeComputed = createComputed([themeStore, mediaQuery], ([theme, isDark]) => {
  if (theme === 'system') {
    return isDark ? 'dark' : 'light'
  }
  return theme
})

export function useResolvedTheme() {
  return useSubscription(resolvedThemeComputed)
}

function toggleTheme() {
  const root = window.document.documentElement
  const resolved = resolvedThemeComputed.get()

  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
}

mediaQuery.subscribe(toggleTheme)
themeStore.subscribe(toggleTheme)
