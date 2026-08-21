import * as React from 'react'

export const areDepsEqual = (
  previous: React.DependencyList | null,
  next: React.DependencyList
) =>
  previous !== null &&
  previous.length === next.length &&
  next.every((dep, index) => Object.is(dep, previous[index]))

export const useMountedEffect = (
  effect: React.EffectCallback,
  deps: React.DependencyList = []
) => {
  const previousDepsRef = React.useRef<React.DependencyList | null>(null)
  const cleanupRef = React.useRef<(() => void) | null>(null)

  const effectEvent = React.useEffectEvent(effect)

  React.useEffect(() => {
    const previousDeps = previousDepsRef.current
    previousDepsRef.current = deps

    if (previousDeps === null || areDepsEqual(previousDeps, deps)) {
      return
    }

    cleanupRef.current?.()
    const cleanup = effectEvent()
    cleanupRef.current = typeof cleanup === 'function' ? cleanup : null
  })

  React.useEffect(
    () => () => {
      cleanupRef.current?.()
    },
    []
  )
}
