import * as React from 'react'

export function useMountedEffect(effect: React.EffectCallback, deps: React.DependencyList = []) {
  const isMountedRef = React.useRef(false)

  const effectEvent = React.useEffectEvent(effect)

  React.useEffect(() => {
    if (isMountedRef.current) {
      return effectEvent()
    }
    isMountedRef.current = true
    // oxlint-disable-next-line react/exhaustive-deps
  }, deps)
}
