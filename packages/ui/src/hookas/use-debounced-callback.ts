import * as React from 'react'

// oxlint-disable-next-line typescript/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedFn = React.useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        fn(...args)
      }, delay)
    },
    [
      fn,
      delay,
      // oxlint-disable-next-line react/exhaustive-deps
      ...deps,
    ],
  )

  React.useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  return debouncedFn
}
