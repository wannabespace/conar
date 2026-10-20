import { createServerFn } from '@tanstack/react-start'
import { type } from 'arktype'

import { api, getSessionUser } from './account.server'

export const getViewer = createServerFn({ method: 'GET' }).handler(() =>
  getSessionUser()
)

export const getMyShares = createServerFn({ method: 'GET' }).handler(
  async () => {
    const shares = await api.shares.list()
    return shares.map((share) => ({
      connection: share.connection,
      expiresAt: share.expiresAt,
      failingSince: share.failingSince,
      hasPassword: share.hasPassword,
      id: share.id,
      name: share.name,
      refresh: share.refresh,
      schema: share.schema,
      table: share.table,
    }))
  }
)

export const stopSharing = createServerFn({ method: 'POST' })
  .validator(type({ id: 'string.uuid' }))
  .handler(({ data }) => api.shares.remove(data))
