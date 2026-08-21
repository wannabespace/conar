import * as React from 'react'

export const useMediaQuery = (query: string, initialValue?: boolean) => {
  const subscribe = (onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener('change', onStoreChange)
    return () => {
      mediaQuery.removeEventListener('change', onStoreChange)
    }
  }

  const getSnapshot = () => window.matchMedia(query).matches

  const getServerSnapshot = () => initialValue ?? false

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
