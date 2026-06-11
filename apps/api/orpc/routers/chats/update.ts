import { db } from '@conar/db'
import { chats, chatsUpdateSchema } from '@conar/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm/sql'
import { generateTxId } from '~/lib/electric'
import { orpc, subscriptionMiddleware } from '~/orpc'

export const update = orpc
  .use(subscriptionMiddleware)
  .input(type.and(
    chatsUpdateSchema.omit('createdAt', 'updatedAt', 'id', 'userId', 'activeStreamId', 'connectionId'),
    chatsUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input

    return db.transaction(async (tx) => {
      await tx.update(chats).set(changes).where(and(eq(chats.id, id), eq(chats.userId, context.user.id)))

      return { txid: await generateTxId(tx) }
    })
  })
