import * as React from 'react'

// eslint-disable-next-line ts/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList,
  delay: number,
): (...args: Parameters<T>) => void {
  const lastExecutedRef = React.useRef(0)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const argsRef = React.useRef<Parameters<T> | null>(null)

  const throttledFn = React.useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const remaining = delay - (now - lastExecutedRef.current)

      argsRef.current = args

      if (remaining <= 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        lastExecutedRef.current = now
        fn(...args)
      }
      else if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          lastExecutedRef.current = Date.now()
          timerRef.current = null
          if (argsRef.current) {
            fn(...argsRef.current)
          }
        }, remaining)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay, ...deps],
  )

  React.useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return throttledFn
}
