import { db } from '@conar/db'
import { chats, chatsMessages, chatsMessagesUpdateSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from './events'

export const update = orpc
  .use(subscriptionMiddleware)
  .input(type.and(
    chatsMessagesUpdateSchema.omit('id'),
    chatsMessagesUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const [found] = await db.select({ userId: chats.userId, chatId: chatsMessages.chatId })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .where(and(eq(chatsMessages.id, input.id), eq(chats.userId, context.user.id)))

    if (!found) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat message not found',
      })
    }

    const [message] = await db
      .update(chatsMessages)
      .set(input)
      .where(eq(chatsMessages.id, input.id))
      .returning()

    publisher.publish('event', {
      type: 'update',
      value: message!,
      clientId: context.clientId,
    })
  })
