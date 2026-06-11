import { db } from '@conar/db'
import { chats, chatsMessages, chatsMessagesInsertSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { generateTxId } from '~/lib/electric'
import { orpc, subscriptionMiddleware } from '~/orpc'

const schema = chatsMessagesInsertSchema

export const create = orpc
  .use(subscriptionMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
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

    return db.transaction(async (tx) => {
      await tx.insert(chatsMessages).values(input)

      return { txid: await generateTxId(tx) }
    })
  })
