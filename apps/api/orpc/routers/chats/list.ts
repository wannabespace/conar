import { desc, eq } from 'drizzle-orm'
import { chats, chatsMessages, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    return db.query.chats.findMany({
      where: eq(chats.userId, context.user.id),
      orderBy: desc(chats.createdAt),
      with: {
        messages: {
          orderBy: desc(chatsMessages.createdAt),
        },
      },
    })
  })
