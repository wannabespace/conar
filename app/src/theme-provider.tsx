import { createContext, useContext, useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import { SharedContext } from 'shared'
import { THEME_KEY } from './lib/constants'

type Theme = 'dark' | 'light' | 'system'

const ThemeProviderContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>(null!)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) || 'system',
  )
  const isDark = useMedia('(prefers-color-scheme: dark)')

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = isDark ? 'dark' : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, isDark])

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme: (theme: Theme) => {
          localStorage.setItem(THEME_KEY, theme)
          setTheme(theme)
        },
      }}
    >
      <SharedContext.Provider value={{ theme, setTheme }}>
        {children}
      </SharedContext.Provider>
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
