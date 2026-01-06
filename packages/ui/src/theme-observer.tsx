import { FunctionOnce } from './lib/function-once'
import { initThemeStore } from './theme-store'

export type { ResolvedTheme, Theme } from './theme-store'

interface ThemeObserverProps {
  defaultTheme?: 'dark' | 'light' | 'system'
  storageKey?: string
}

export function ThemeObserver({
  defaultTheme = 'system',
  storageKey = 'conar.theme',
}: ThemeObserverProps) {
  initThemeStore(defaultTheme, storageKey)

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
