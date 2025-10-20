import * as React from 'react'
import { useDebouncedCallback } from './use-debounced-callback'

export function useDebouncedMemo<T>(factory: () => T, deps: React.DependencyList, delay: number) {
  const [state, setState] = React.useState<T>(() => factory())

  const factoryEvent = React.useEffectEvent(factory)

  const debouncedSetState = useDebouncedCallback((value: T) => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setState(value)
  }, [], delay)

  React.useEffect(() => {
    debouncedSetState(factoryEvent())
  }, [
    debouncedSetState,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...deps,
  ])

  return state
}
