import * as React from 'react'

export function useMountedEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList = [],
) {
  const isMounted = React.useRef(false)

  const effectEvent = React.useEffectEvent(effect)

  React.useEffect(() => {
    if (isMounted.current) {
      return effectEvent()
    }
    isMounted.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
