import { createEffect } from '@tanstack/react-db'
import { useEffect } from 'react'

import { useCollections } from '~/entities/collections'
import type { ConnectionResource } from '~/entities/connection/core'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'

export function useLastOpenedResourcesSync() {
  const collections = useCollections()

  useEffect(() => {
    if (!collections) return

    const effect = createEffect<ConnectionResource>({
      query: q => q.from({ connectionsResources: collections.connectionsResourcesCollection }),
      skipInitial: true,
      onExit: ({ value }) => {
        lastOpenedResourcesStorageValue.set(prev => prev.filter(id => id !== value.id))
      },
    })

    return () => {
      effect.dispose()
    }
  }, [collections])
}
