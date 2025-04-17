import * as React from 'react'
import { useDebouncedCallback } from './use-debounced-callback'

export function useDebouncedMemo<T>(factory: () => T, deps: React.DependencyList, delay: number) {
  const [state, setState] = React.useState<T>(() => factory())

  const debouncedSetState = useDebouncedCallback((value: T) => {
    setState(value)
  }, [setState], delay)

  React.useEffect(() => {
    debouncedSetState(factory())
  }, [...deps, debouncedSetState])

  return state
}
