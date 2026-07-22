import { type } from 'arktype'
import { createComputed } from 'seitu'
import { useSubscription } from 'seitu/react'
import { createMediaQuery, createWebStorageValue } from 'seitu/web'

export type ResolvedTheme = 'dark' | 'light'
export type Theme = ResolvedTheme | 'system'

export const THEME_STORAGE_KEY = 'tamery.theme'

export const themeStore = createWebStorageValue({
  type: 'localStorage',
  key: THEME_STORAGE_KEY,
  schema: type('"dark" | "light" | "system"'),
  defaultValue: 'system',
})

const mediaQuery = createMediaQuery({ query: '(prefers-color-scheme: dark)' })

export const resolvedTheme = createComputed([themeStore, mediaQuery], ([theme, isDark]) => {
  if (theme === 'system') {
    return isDark ? 'dark' : 'light'
  }
  return theme
})

export function useTheme() {
  return useSubscription(themeStore)
}

export function useResolvedTheme() {
  return useSubscription(resolvedTheme)
}

function toggleTheme() {
  if (typeof window === 'undefined') {
    return
  }

  const root = window.document.documentElement
  const resolved = resolvedTheme.get()

  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
}

resolvedTheme.subscribe(toggleTheme, { immediate: true })
