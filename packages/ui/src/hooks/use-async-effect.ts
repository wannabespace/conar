import type { DependencyList } from 'react'
import { useEffect, useState } from 'react'

export function useAsyncEffect(
  effect: () => Promise<void | (() => Promise<void> | void)>,
  deps?: DependencyList,
) {
  const [destroy, setDestroy] = useState<void | (() => Promise<void> | void) | undefined>(undefined)

  useEffect(() => {
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
