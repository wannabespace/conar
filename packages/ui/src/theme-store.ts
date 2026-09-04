import { type } from 'arktype'
import { createComputed } from 'seitu'
import { useSubscription } from 'seitu/react'
import { createMediaQuery, createWebStorageValue } from 'seitu/web'

import { THEME_STORAGE_KEY } from './theme-constants'

export { THEME_STORAGE_KEY } from './theme-constants'
export type { ResolvedTheme, Theme } from './theme-constants'

export const themeStore = createWebStorageValue({
  defaultValue: 'system',
  key: THEME_STORAGE_KEY,
  schema: type('"dark" | "light" | "system"'),
  type: 'localStorage',
})

const mediaQuery = createMediaQuery({ query: '(prefers-color-scheme: dark)' })

export const resolvedTheme = createComputed(
  [themeStore, mediaQuery],
  ([theme, isDark]) => {
    if (theme === 'system') {
      return isDark ? 'dark' : 'light'
    }
    return theme
  }
)

export const useTheme = () => useSubscription(themeStore)

export const useResolvedTheme = () => useSubscription(resolvedTheme)

const toggleTheme = () => {
  if (typeof window === 'undefined') {
    return
  }

  const root = window.document.documentElement
  const resolved = resolvedTheme.get()

  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
}

resolvedTheme.subscribe(toggleTheme, { immediate: true })
