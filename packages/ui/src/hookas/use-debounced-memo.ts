import * as React from 'react'

import { useDebouncedCallback } from './use-debounced-callback'
import { areDepsEqual } from './use-mounted-effect'

export const useDebouncedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  delay: number
) => {
  const [state, setState] = React.useState<T>(() => factory())
  const previousDepsRef = React.useRef<React.DependencyList | null>(null)

  const factoryEvent = React.useEffectEvent(factory)

  const debouncedSetState = useDebouncedCallback(
    (value: T) => {
      // oxlint-disable-next-line react/set-state-in-effect
      setState(value)
    },
    [],
    delay
  )

  React.useEffect(() => {
    const previousDeps = previousDepsRef.current
    previousDepsRef.current = deps

    if (areDepsEqual(previousDeps, deps)) {
      return
    }

    debouncedSetState(factoryEvent())
  })

  return state
}
