import * as React from 'react'

export function getLocalStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : defaultValue
  }
  catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const readValue = React.useCallback(() => {
    const initial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue

    return getLocalStorageValue(key, initial)
  }, [key])

  const [storedValue, setStoredValue] = React.useState<T>(readValue)

  const setValue = React.useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore
        = typeof value === 'function' ? (value as (val: T) => T)(storedValue) : value

      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    }
    catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  React.useEffect(() => {
    setStoredValue(readValue())
  }, [key, readValue])

  React.useEffect(() => {
    const abortController = new AbortController()

    window.addEventListener('storage', () => {
      setStoredValue(readValue())
    }, { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [readValue])

  return [storedValue, setValue] as const
}
