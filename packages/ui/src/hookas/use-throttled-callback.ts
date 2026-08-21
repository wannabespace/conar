import * as React from 'react'

// oxlint-disable-next-line ts/no-explicit-any
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  fn: T,
  _deps: React.DependencyList,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const lastExecutedRef = React.useRef(0)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const argsRef = React.useRef<Parameters<T> | null>(null)
  const fnRef = React.useRef(fn)

  React.useEffect(() => {
    fnRef.current = fn
  })

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = delay - (now - lastExecutedRef.current)

    argsRef.current = args

    if (remaining <= 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      lastExecutedRef.current = now
      fnRef.current(...args)
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now()
        timerRef.current = null
        if (argsRef.current) {
          fnRef.current(...argsRef.current)
        }
      }, remaining)
    }
  }

  React.useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    []
  )

  return throttledFn
}
