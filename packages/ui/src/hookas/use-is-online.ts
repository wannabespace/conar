import { useEffect, useState } from 'react'

export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()

    window.addEventListener('online', () => setIsOnline(true), { signal: abortController.signal })
    window.addEventListener('offline', () => setIsOnline(false), { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [])

  return isOnline
}
