import * as React from 'react'

// oxlint-disable-next-line ts/no-explicit-any
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  fn: T,
  _deps: React.DependencyList,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const fnRef = React.useRef(fn)

  React.useEffect(() => {
    fnRef.current = fn
  })

  const debouncedFn = (...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      fnRef.current(...args)
    }, delay)
  }

  React.useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    []
  )

  return debouncedFn
}
