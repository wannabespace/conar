import { db } from '@conar/db'
import { chats, chatsMessages, chatsMessagesInsertSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from './events'

export const create = orpc
  .use(subscriptionMiddleware)
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

    const [message] = await db.insert(chatsMessages).values(input).returning()

    publisher.publish('event', {
      type: 'insert',
      value: message!,
      clientId: context.clientId,
    })
  })
