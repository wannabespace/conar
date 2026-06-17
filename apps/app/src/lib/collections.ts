import { getRouteApi } from '@tanstack/react-router'
import { clearMemoizeCache, memoize } from 'memoza'
import { createChatCollections } from '~/entities/chat/sync'
import { createConnectionCollections } from '~/entities/connection/sync'
import { createQueryCollections } from '~/entities/query/sync'

export const getCollections = memoize(() => {
  const connectionColls = createConnectionCollections()
  const chatColls = createChatCollections()
  const queryColls = createQueryCollections()

  const collections = { ...connectionColls, ...chatColls, ...queryColls }

  return collections
}, {
  cacheKey: 'collections',
})

export type Collections = ReturnType<typeof getCollections>

export function clearCollectionsCache() {
  clearMemoizeCache(getCollections)
}

const protectedApi = getRouteApi('/_protected')

export function useCollections() {
  return protectedApi.useRouteContext({ select: c => c.collections })
}
