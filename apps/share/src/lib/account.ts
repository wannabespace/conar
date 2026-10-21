import { pick } from '@tamery/shared/utils'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'

import { api, getSessionUser } from './account.server'

const getViewer = createServerFn({ method: 'GET' }).handler(() =>
  getSessionUser()
)

export const viewerQueryOptions = queryOptions({
  queryFn: () => getViewer(),
  queryKey: ['viewer'],
  staleTime: 'static',
})

export const getMyShares = createServerFn({ method: 'GET' }).handler(
  async () => {
    const shares = await api.shares.list()
    return shares.map((share) =>
      pick(share, [
        'connection',
        'expiresAt',
        'failingSince',
        'hasPassword',
        'id',
        'name',
        'refresh',
        'schema',
        'table',
      ])
    )
  }
)

export type MyShare = Awaited<ReturnType<typeof getMyShares>>[number]

export const stopSharing = createServerFn({ method: 'POST' })
  .validator(type({ id: 'string.uuid' }))
  .handler(({ data }) => api.shares.remove(data))
