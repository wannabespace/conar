import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import {
  chats,
  chatsMessages,
  chatsMessagesInsertSchema,
} from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'

import { orpc, subscriptionMiddleware } from '~/orpc'

import { publisher } from './events'

const schema = chatsMessagesInsertSchema

export const create = orpc
  .use(subscriptionMiddleware)
  .input(
    type
      .or(schema, schema.array())
      .pipe((data) => (Array.isArray(data) ? data : [data]))
  )
  .handler(async ({ context, input }) => {
    const chatIds = input.map((item) => item.chatId)
    const foundChats = await db
      .select({ id: chats.id })
      .from(chats)
      .where(and(inArray(chats.id, chatIds), eq(chats.userId, context.user.id)))

    if (foundChats.length !== chatIds.length) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Chat not found',
      })
    }

    const insertedRows = await db.transaction((tx) =>
      Promise.all(
        input.map((item) =>
          tx
            .insert(chatsMessages)
            .values(item)
            .onConflictDoUpdate({
              set: item,
              target: chatsMessages.id,
            })
            .returning()
        )
      )
    )
    const inserted = insertedRows.flat()

    for (const item of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: item,
      })
    }
  })
