import type { Connection } from '~/entities/connection/sync'
import { createEffect } from '@tanstack/react-db'
import { getRouteApi } from '@tanstack/react-router'
import { clearMemoizeCache, memoize } from 'memoza'
import { createChatCollections } from '~/entities/chat/sync'
import { createConnectionStringsCollection } from '~/entities/connection/connection-strings'
import { createConnectionCollections } from '~/entities/connection/sync'
import { createQueryCollections } from '~/entities/query/sync'

type ActiveCollections = ReturnType<typeof createConnectionCollections>
  & ReturnType<typeof createChatCollections>
  & ReturnType<typeof createQueryCollections>
  & ReturnType<typeof createConnectionStringsCollection>

let activeCollections: ActiveCollections | null = null

function buildCollections(): ActiveCollections {
  const connectionStringsColls = createConnectionStringsCollection()
  const connectionColls = createConnectionCollections({ decrypt: connectionStringsColls.connectionStringsCollection.utils.decrypt })
  const chatColls = createChatCollections()
  const queryColls = createQueryCollections()

  const effect = createEffect<Connection>({
    query: q => q.from({ connections: connectionColls.connectionsCollection }),
    skipInitial: false,
    onEnter: async ({ value }) => {
      await connectionStringsColls.connectionStringsCollection.utils.resolve(value.id)
    },
    onExit: async ({ value }) => {
      connectionStringsColls.connectionStringsCollection.delete(value.id)
    },
  })

  connectionColls.connectionsCollection.on('status:cleaned-up', () => {
    effect.dispose()
  })

  return {
    ...connectionColls,
    ...chatColls,
    ...queryColls,
    ...connectionStringsColls,
  }
}

export const getCollections = memoize(() => {
  activeCollections = buildCollections()
  return activeCollections
})

export type Collections = ReturnType<typeof getCollections>

export function clearCollections() {
  activeCollections = null
  clearMemoizeCache(getCollections)
}

const protectedApi = getRouteApi('/_protected')

export function useCollections() {
  return protectedApi.useLoaderData({ select: c => c.collections })
}
