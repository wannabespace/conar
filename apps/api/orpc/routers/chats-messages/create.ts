import { db } from '@tamery/db'
import {
  chats,
  chatsMessages,
  chatsMessagesInsertSchema,
} from '@tamery/db/schema'
import { and, eq } from 'drizzle-orm'

import { orpc, subscriptionMiddleware } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(subscriptionMiddleware)
  .input(chatsMessagesInsertSchema)
  .errors({
    NOT_FOUND: { message: 'Chat not found' },
  })
  .handler(async ({ context, errors, input }) => {
    const [chat] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.id, input.chatId), eq(chats.userId, context.user.id)))
      .limit(1)

    if (!chat) {
      throw errors.NOT_FOUND()
    }

    const [inserted] = await db
      .insert(chatsMessages)
      .values(input)
      .onConflictDoUpdate({
        set: input,
        target: chatsMessages.id,
      })
      .returning()

    if (!inserted) {
      throw new Error('Failed to create chat message')
    }

    publisher.publish(context.user.id, {
      type: 'insert',
      value: inserted,
    })
  })
