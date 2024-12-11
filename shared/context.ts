import { createContext, use } from 'react'

export const SharedContext = createContext<{
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}>(null!)

export function useSharedContext() {
  return use(SharedContext)
}
