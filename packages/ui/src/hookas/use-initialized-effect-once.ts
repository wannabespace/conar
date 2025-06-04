import * as React from 'react'
import { useInitializedEffect } from './use-initialized-effect'

export function useInitializedEffectOnce(effect: React.EffectCallback, deps: React.DependencyList) {
  const initialized = React.useRef(false)

  useInitializedEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return effect()
    }
  }, deps)
}
