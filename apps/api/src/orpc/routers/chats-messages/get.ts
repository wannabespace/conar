import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { chats, chatsMessages, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const get = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
  }))
  .handler(async ({ context, input }) => {
    const [message] = await db.select({
      ...getTableColumns(chatsMessages),
      userId: chats.userId,
    })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .where(and(eq(chatsMessages.id, input.id), eq(chats.userId, context.user.id)))

    if (!message) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat message not found',
      })
    }

    return message
  })
