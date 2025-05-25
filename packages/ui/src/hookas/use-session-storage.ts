import * as React from 'react'

export function useSessionStorage<T>(key: string, initialValue: T | (() => T)) {
  const readValue = () => {
    const initial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue

    if (typeof window === 'undefined') {
      return initial
    }

    try {
      const item = window.sessionStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initial
    }
    catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initial
    }
  }

  const [storedValue, setStoredValue] = React.useState<T>(readValue)

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore
        = typeof value === 'function' ? (value as (val: T) => T)(storedValue) : value

      // Save state
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
      }
    }
    catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }

  React.useEffect(() => {
    const abortController = new AbortController()

    window.addEventListener('storage', () => {
      setStoredValue(readValue())
    }, { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [])

  return [storedValue, setValue] as const
}
