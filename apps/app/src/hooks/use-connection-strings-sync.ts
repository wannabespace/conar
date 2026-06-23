import type { Connection } from '~/entities/connection/sync'
import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'
import { connectionStringsCollection } from '~/entities/connection/connection-strings'
import { connectionsCollection } from '~/entities/connection/sync'

export function useConnectionStringsSync() {
  useEffect(() => {
    const effect = createEffect<Connection>({
      query: q => q.from({ connections: connectionsCollection }),
      skipInitial: false,
      onEnter: async ({ value }) => {
        const connectionString = await connectionStringsCollection.utils.resolve(value.id)

        if (connectionString) {
          const record = await connectionStringsCollection.utils.prepare({ connectionId: value.id, connectionString, updatedAt: value.updatedAt })

          if (connectionStringsCollection.has(value.id)) {
            connectionStringsCollection.update(value.id, draft => Object.assign(draft, record))
          }
          else {
            connectionStringsCollection.insert(record)
          }
        }
      },
    })

    return () => {
      effect.dispose()
    }
  }, [])
}
