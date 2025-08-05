import { type } from 'arktype'
import { and, desc, eq } from 'drizzle-orm'
import { chats, chatsMessages, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const get = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
  }))
  .handler(async ({ context, input }) => db.query.chats.findFirst({
    where: and(eq(chats.userId, context.user.id), eq(chats.id, input.id)),
    with: {
      messages: {
        orderBy: desc(chatsMessages.createdAt),
      },
    },
  }),
  )
