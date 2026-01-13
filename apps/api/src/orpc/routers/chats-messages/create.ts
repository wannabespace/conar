import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { chats, chatsMessages, chatsMessagesInsertSchema, db } from '~/drizzle'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

export const create = orpc
  .use(requireSubscriptionMiddleware)
  .input(chatsMessagesInsertSchema)
  .handler(async ({ context, input }) => {
    const [chat] = await db.select({ userId: chats.userId })
      .from(chats)
      .where(and(eq(chats.id, input.chatId), eq(chats.userId, context.user.id)))

    if (!chat) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat not found',
      })
    }

    await db
      .insert(chatsMessages)
      .values(input)
      .onConflictDoUpdate({
        target: chatsMessages.id,
        set: input,
      })
  })
