import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'

import { useCollections } from '~/core/collections'
import type { Connection } from '~/core/connection/sync'
import { dropConnectionQueries } from '~/core/connection/update'
import { useIsOnline } from '~/store'

export const useConnectionStringsSync = () => {
  const collections = useCollections()
  const isOnline = useIsOnline()

  useEffect(() => {
    if (!collections || !isOnline) {
      return
    }

    const { connectionsCollection, connectionStringsCollection } = collections

    const resolve = async (
      { value }: { value: Connection },
      { signal }: { signal: AbortSignal }
    ) => {
      const connectionString =
        await connectionStringsCollection.utils.resolve(value)

      if (signal.aborted || !connectionString) {
        return
      }

      const record = await connectionStringsCollection.utils.prepare({
        connectionId: value.id,
        connectionString,
        updatedAt: value.updatedAt,
      })

      if (signal.aborted) {
        return
      }

      if (connectionStringsCollection.has(value.id)) {
        connectionStringsCollection.update(value.id, (draft) => {
          Object.assign(draft, record)
        })
      } else {
        connectionStringsCollection.insert(record)
      }
      dropConnectionQueries(value.id)
    }

    // On update too: an edit on another device (host, credentials, sync type) reaches this one without a restart.
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
