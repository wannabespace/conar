import * as React from 'react'

export function sessionStorageValue<T>(key: string, defaultValue: T) {
  return {
    get(): T {
      if (typeof window === 'undefined') {
        return defaultValue
      }

      const item = window.sessionStorage.getItem(key)

      if (item === null) {
        return defaultValue
      }

      try {
        return JSON.parse(item)
      }
      catch {
        return typeof defaultValue === 'string' ? item as T : defaultValue
      }
    },
    set(value: T): void {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(value))
        window.dispatchEvent(new Event('storage'))
      }
    },
    remove(): void {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
        window.dispatchEvent(new Event('storage'))
      }
    },
  }
}

export function useSessionStorage<T>(key: string, defaultValue: T | (() => T)) {
  const value = React.useMemo(() => {
    const defaultVal = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue
    return sessionStorageValue(key, defaultVal)
  }, [key, defaultValue])
  const [storedValue, setStoredValue] = React.useState(value.get)
  const setValue = React.useCallback((newValue: T | ((val: T) => T)) => {
    value.set(typeof newValue === 'function' ? (newValue as (val: T) => T)(storedValue) : newValue)
  }, [value, storedValue])

  React.useEffect(() => {
    const abortController = new AbortController()

    window.addEventListener('storage', () => {
      setStoredValue(value.get)
    }, { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [value, setStoredValue])

  return [storedValue, setValue] as const
}
