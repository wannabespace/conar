import { db } from '@conar/db'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    return db.query.chats.findMany({
      where: {
        userId: context.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      with: {
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  })
