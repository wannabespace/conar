import { getRouteApi } from '@tanstack/react-router'
import { clearMemoizeCache, memoize } from 'memoza'
import { createChatCollections } from '~/entities/chat/sync'
import { createConnectionCollections } from '~/entities/connection/sync'
import { createQueryCollections } from '~/entities/query/sync'

type ActiveCollections = ReturnType<typeof createConnectionCollections>
  & ReturnType<typeof createChatCollections>
  & ReturnType<typeof createQueryCollections>

let activeCollections: ActiveCollections | null = null

function buildCollections(): ActiveCollections {
  const connectionColls = createConnectionCollections()
  const chatColls = createChatCollections()
  const queryColls = createQueryCollections()

  return {
    ...connectionColls,
    ...chatColls,
    ...queryColls,
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
