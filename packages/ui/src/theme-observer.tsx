import { FunctionOnce } from './lib/function-once'
import { THEME_STORAGE_KEY } from './theme-store'

export type { ResolvedTheme, Theme } from './theme-store'

export function ThemeObserver() {
  return (
    <FunctionOnce param={THEME_STORAGE_KEY}>
      {(key) => {
        const theme: string | null = localStorage.getItem(key)

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
