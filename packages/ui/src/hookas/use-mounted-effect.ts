import * as React from 'react'

export function useMountedEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList,
) {
  const isMounted = React.useRef(false)

  React.useEffect(() => {
    if (isMounted.current) {
      return effect()
    }
    isMounted.current = true
  }, [
    effect,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...(deps ?? []),
  ])
}
