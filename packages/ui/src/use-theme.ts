import type { ResolvedTheme, Theme } from './theme-store'
import { useStore } from '@tanstack/react-store'
import { getThemeStore, setTheme } from './theme-store'

export function useTheme() {
  const store = useStore(getThemeStore(), state => state)

  return {
    theme: store.theme,
    resolvedTheme: store.resolvedTheme,
    setTheme,
  }
}

export type { ResolvedTheme, Theme }
