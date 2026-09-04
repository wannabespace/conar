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
  .errors({
    NOT_FOUND: { message: 'Chat message not found' },
  })
  .handler(async ({ context, errors, input }) => {
    const [found] = await db
      .select({ chatId: chatsMessages.chatId, userId: chats.userId })
      .from(chatsMessages)
      .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
      .where(
        and(eq(chatsMessages.id, input.id), eq(chats.userId, context.user.id))
      )

    if (!found) {
      throw errors.NOT_FOUND()
    }

    const [message] = await db
      .update(chatsMessages)
      .set(input)
      .where(eq(chatsMessages.id, input.id))
      .returning()

    if (!message) {
      throw errors.NOT_FOUND({ message: 'Chat message not found after update' })
    }

    publisher.publish(context.user.id, {
      type: 'update',
      value: message,
    })
  })
