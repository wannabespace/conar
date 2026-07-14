import * as React from 'react'

import { useDebouncedCallback } from './use-debounced-callback'

export function useDebouncedMemo<T>(factory: () => T, deps: React.DependencyList, delay: number) {
  const [state, setState] = React.useState<T>(() => factory())

  const factoryEvent = React.useEffectEvent(factory)

  const debouncedSetState = useDebouncedCallback(
    (value: T) => {
      setState(value)
    },
    [],
    delay,
  )

  React.useEffect(() => {
    debouncedSetState(factoryEvent())
  }, [
    debouncedSetState,
    // oxlint-disable-next-line react/exhaustive-deps
    ...deps,
  ])

  return state
}
