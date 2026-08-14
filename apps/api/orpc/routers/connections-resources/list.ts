import { db } from '@tamery/db'

import { authMiddleware, orpc } from '~/orpc'

export const list = orpc.use(authMiddleware).handler(({ context }) =>
  db.query.connectionsResources.findMany({
    columns: {
      connectionId: true,
      createdAt: true,
      id: true,
      name: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      connection: {
        userId: {
          eq: context.user.id,
        },
      },
    },
  })
)
