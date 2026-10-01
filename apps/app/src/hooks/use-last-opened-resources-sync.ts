import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'

import { useCollections } from '~/core/collections.ts'
import { lastOpenedResourcesStorageValue } from '~/core/connection/last-opened-resources'
import type { ConnectionResource } from '~/core/connection/sync'

export const useLastOpenedResourcesSync = () => {
  const collections = useCollections()

  useEffect(() => {
    if (!collections) {
      return
    }

    const effect = createEffect<ConnectionResource>({
      onExit: ({ value }) => {
        lastOpenedResourcesStorageValue.set((prev) =>
          prev.filter((id) => id !== value.id)
        )
      },
      query: (q) =>
        q.from({
          connectionsResources: collections.connectionsResourcesCollection,
        }),
      skipInitial: true,
    })

    return () => {
      effect.dispose()
    }
  }, [collections])
}
