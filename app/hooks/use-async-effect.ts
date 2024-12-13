import { useEffect } from 'react'

// eslint-disable-next-line ts/no-explicit-any
let state: any
// eslint-disable-next-line ts/no-explicit-any
let promise: any

export function useAsyncEffect(
  effect: () => Promise<void | (() => Promise<void> | void)>,
  deps: React.DependencyList,
) {
  useEffect(() => {
    if (promise)
      return

    (async () => {
      promise = effect()

      const res = await promise

      promise = undefined
      state = res
    })()

    return () => {
      if (typeof state === 'function')
        state()

      state = undefined
      promise = undefined
    }
  }, deps)
}
