import * as React from 'react'

export function localStorageValue(key: string) {
  return {
    get<T>(defaultValue: T): T {
      if (typeof window === 'undefined') {
        return defaultValue
      }

      const item = window.localStorage.getItem(key)

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
    set<T>(value: T): void {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value))
        window.dispatchEvent(new Event('storage'))
      }
    },
    remove(): void {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        window.dispatchEvent(new Event('storage'))
      }
    },
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T | (() => T)) {
  const value = React.useMemo(() => localStorageValue(key), [key])
  const getValue = React.useCallback(() => {
    const initial = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue

    return value.get(initial)
  }, [value, defaultValue])
  const [storedValue, setStoredValue] = React.useState(getValue)
  const setValue = React.useCallback((newValue: T | ((val: T) => T)) => {
    value.set(typeof newValue === 'function' ? (newValue as (val: T) => T)(storedValue) : newValue)
  }, [value, storedValue])

  React.useEffect(() => {
    const abortController = new AbortController()

    window.addEventListener('storage', () => {
      setStoredValue(getValue)
    }, { signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [getValue])

  return [storedValue, setValue] as const
}
