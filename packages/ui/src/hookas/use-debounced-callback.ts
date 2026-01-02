import * as React from 'react'

// eslint-disable-next-line ts/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  _deps: React.DependencyList,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedFn = (...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  React.useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return debouncedFn
}
