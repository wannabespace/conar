import { db } from '@tamery/db'
import { omit } from '@tamery/shared/utils'

import { authMiddleware, orpc } from '~/orpc'

export const list = orpc.use(authMiddleware).handler(async ({ context }) => {
  const rows = await db.query.shares.findMany({
    columns: { userId: false },
    orderBy: { createdAt: 'desc' },
    where: { userId: { eq: context.user.id } },
    with: {
      connectionResource: {
        columns: {},
        with: {
          connection: {
            columns: { label: true, name: true, provider: true, type: true },
          },
        },
      },
    },
  })

  return rows.map(({ connectionResource, ...share }) => ({
    ...omit(share, ['passwordHash']),
    connection: connectionResource.connection,
    hasPassword: share.passwordHash !== null,
  }))
})
