'use client'

import * as React from 'react'

export function useInitializedEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  React.useEffect(() => {
    if (deps.every(dep => dep !== undefined)) {
      return effect()
    }
  }, deps)
}
