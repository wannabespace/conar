import { createContext, useContext } from 'react'

export const SharedContext = createContext<{
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}>(null!)

export function useSharedContext() {
  return useContext(SharedContext)
}
