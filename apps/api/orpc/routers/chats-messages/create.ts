import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import { chats, chatsMessages, chatsMessagesInsertSchema } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { orpc, subscriptionMiddleware } from '~/orpc'
import { publisher } from './events'

const schema = chatsMessagesInsertSchema

export const create = orpc
  .use(subscriptionMiddleware)
  .input(type.or(schema, schema.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    const chatIds = input.map(item => item.chatId)
    const foundChats = await db.select({ id: chats.id })
      .from(chats)
      .where(and(inArray(chats.id, chatIds), eq(chats.userId, context.user.id)))

    if (foundChats.length !== chatIds.length) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat not found',
      })
    }

    const inserted = await db.insert(chatsMessages).values(input).returning()

    for (const message of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: message,
      })
    }
  })
