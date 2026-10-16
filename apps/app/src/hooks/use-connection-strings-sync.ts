import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'

import { useCollections } from '~/core/collections'
import type { Connection } from '~/core/connection/sync'
import { useIsOnline } from '~/store'

export const useConnectionStringsSync = () => {
  const collections = useCollections()
  const isOnline = useIsOnline()

  useEffect(() => {
    if (!collections || !isOnline) {
      return
    }

    const { connectionsCollection, connectionStringsCollection } = collections

    const resolve = (
      { value }: { value: Connection },
      { signal }: { signal: AbortSignal }
    ) => connectionStringsCollection.utils.resolve(value, signal)

    const effect = createEffect<Connection>({
      onEnter: resolve,
      onUpdate: resolve,
      query: (q) => q.from({ connections: connectionsCollection }),
      skipInitial: false,
    })

    return () => {
      effect.dispose()
    }
  }, [collections, isOnline])
}
