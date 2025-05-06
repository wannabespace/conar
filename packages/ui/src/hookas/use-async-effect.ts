'use client'

import type { DependencyList } from 'react'
import * as React from 'react'

export function useAsyncEffect(
  effect: () => Promise<void | (() => Promise<void> | void)>,
  deps?: DependencyList,
) {
  const [destroy, setDestroy] = React.useState<
    void | (() => Promise<void> | void) | undefined
  >(undefined)

  React.useEffect(() => {
    const e = effect()

    async function execute() {
      setDestroy(await e)
    }

    execute()

    return () => {
      if (typeof destroy === 'function')
        destroy()
    }
  }, deps)
}
