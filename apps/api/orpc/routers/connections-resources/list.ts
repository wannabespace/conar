import { db } from '@conar/db'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    return db.query.connectionsResources.findMany({
      columns: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        connection: {
          userId: {
            eq: context.user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
