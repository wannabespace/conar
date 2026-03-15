import type { ResolvedTheme, Theme } from './theme-store'
import { useSubscription } from 'seitu/react'
import { resolvedThemeComputed, themeStore } from './theme-store'

export function useTheme() {
  const store = useSubscription(themeStore)
  const resolvedTheme = useSubscription(resolvedThemeComputed)

  return {
    theme: store,
    resolvedTheme,
    setTheme: themeStore.set,
  }
}

export type { ResolvedTheme, Theme }
