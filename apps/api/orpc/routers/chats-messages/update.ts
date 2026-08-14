import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import {
  chats,
  chatsMessages,
  chatsMessagesUpdateSchema,
} from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { orpc, subscriptionMiddleware } from '~/orpc'

import { publisher } from './events'

export const update = orpc
  .use(subscriptionMiddleware)
  .input(
    type.and(
      chatsMessagesUpdateSchema.omit('id'),
      chatsMessagesUpdateSchema.pick('id').required()
    )
  )
  .handler(async ({ context, input }) => {
    const [found] = await db
      .select({ chatId: chatsMessages.chatId, userId: chats.userId })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .where(
        and(eq(chatsMessages.id, input.id), eq(chats.userId, context.user.id))
      )

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

    if (!message) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat message not found after update',
      })
    }

    publisher.publish(context.user.id, {
      type: 'update',
      value: message,
    })
  })
