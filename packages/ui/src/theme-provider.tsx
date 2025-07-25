import { ScriptOnce } from '@tanstack/react-router'
import { createContext, use, useEffect, useMemo, useState } from 'react'

export type ResolvedTheme = 'dark' | 'light'
export type Theme = ResolvedTheme | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

const isBrowser = typeof window !== 'undefined'

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'conar.theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (isBrowser ? (localStorage.getItem(storageKey) as Theme) : defaultTheme) || defaultTheme,
  )
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function updateTheme() {
      root.classList.remove('light', 'dark')

      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        setResolvedTheme(systemTheme)
        root.classList.add(systemTheme)
        return
      }

      setResolvedTheme(theme as ResolvedTheme)
      root.classList.add(theme)
    }

    mediaQuery.addEventListener('change', updateTheme)
    updateTheme()

    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }), [theme, resolvedTheme, storageKey])

  return (
    <ThemeProviderContext value={value}>
      <ScriptOnce>
        {`(${((storageKey: string) => {
          const theme = localStorage.getItem(storageKey)

          if (
            theme === 'dark'
            || (
              (theme === null || theme === 'system')
              && window.matchMedia('(prefers-color-scheme: dark)').matches
            )
          ) {
            document.documentElement.classList.add('dark')
          }
        }).toString()})('${storageKey}')`}
      </ScriptOnce>
      {children}
    </ThemeProviderContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = use(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
