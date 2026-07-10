import type { Connection } from '~/entities/connection/core'
import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'
import { useCollections } from '~/entities/collections'

export function useConnectionStringsSync() {
  const collections = useCollections()

  useEffect(() => {
    if (!collections)
      return

    const abortController = new AbortController()
    const { connectionsCollection, connectionStringsCollection } = collections

    const effect = createEffect<Connection>({
      query: q => q.from({ connections: connectionsCollection }),
      skipInitial: false,
      onEnter: async ({ value }) => {
        if (abortController.signal.aborted)
          return

        const connectionString = await connectionStringsCollection.utils.resolve(value.id)

        if (abortController.signal.aborted)
          return

        if (connectionString) {
          const record = await connectionStringsCollection.utils.prepare({ connectionId: value.id, connectionString, updatedAt: value.updatedAt })

          if (abortController.signal.aborted)
            return

          if (connectionStringsCollection.has(value.id)) {
            connectionStringsCollection.update(value.id, (draft) => {
              Object.assign(draft, record)
            })
          }
          else {
            connectionStringsCollection.insert(record)
          }
        }
      },
    })

    return () => {
      abortController.abort()
      effect.dispose()
    }
  }, [collections])
}
