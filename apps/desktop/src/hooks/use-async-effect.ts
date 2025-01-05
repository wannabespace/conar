import { useEffect } from 'react'

// eslint-disable-next-line ts/no-explicit-any
let destroy: any
// eslint-disable-next-line ts/no-explicit-any
let promise: any

export function useAsyncEffect(
  effect: () => Promise<void | (() => Promise<void> | void)>,
  deps: React.DependencyList,
) {
  useEffect(() => {
    if (promise)
      return

    Promise.resolve(effect()).then((res) => {
      promise = undefined
      destroy = res
    })

    return () => {
      promise = undefined

      if (typeof destroy === 'function')
        destroy()

      destroy = undefined
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
