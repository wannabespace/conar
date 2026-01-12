import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { chats, chatsMessages, chatsMessagesUpdateSchema, db } from '~/drizzle'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

export const update = orpc
  .use(requireSubscriptionMiddleware)
  .input(type.and(
    chatsMessagesUpdateSchema.omit('id', 'createdAt', 'updatedAt'),
    chatsMessagesUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const [message] = await db.select({ userId: chats.userId, chatId: chatsMessages.chatId })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .where(and(eq(chatsMessages.id, input.id), eq(chats.userId, context.user.id)))

    if (!message) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat message not found',
      })
    }

    await db
      .update(chatsMessages)
      .set(input)
      .where(eq(chatsMessages.id, input.id))
  })
