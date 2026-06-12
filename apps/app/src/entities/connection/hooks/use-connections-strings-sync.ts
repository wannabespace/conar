import type { Connection } from '../sync'
import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'
import { authClient } from '~/lib/auth'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { orpc } from '~/lib/orpc'
import { connectionsCollection } from '../sync'

export function useConnectionsStringsSync() {
  const { data } = authClient.useSession()
  const isSignedIn = !!data?.user

  useEffect(() => {
    if (!isSignedIn)
      return

    const effect = createEffect<Connection>({
      query: q => q.from({ connections: connectionsCollection }),
      skipInitial: false,
      onEnter: async ({ value }) => {
        if (!navigator.onLine || connectionStringStorage.has(value.id)) {
          return
        }

        try {
          const { connectionString } = await orpc.connections.resolve.call({ id: value.id })
          await connectionStringStorage.set(value.id, connectionString)
        }
        catch {}
      },
      onExit: ({ value }) => {
        connectionStringStorage.remove(value.id)
      },
    })

    return () => {
      effect.dispose()
    }
  }, [isSignedIn])
}
