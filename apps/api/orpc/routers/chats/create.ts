import { db } from '@conar/db'
import { chats, chatsInsertSchema } from '@conar/db/schema'
import { type } from 'arktype'
import { generateTxId } from '~/lib/electric'
import { orpc, subscriptionMiddleware } from '~/orpc'

const schema = chatsInsertSchema.omit('userId', 'activeStreamId', 'title')

export const create = orpc
  .use(subscriptionMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    return db.transaction(async (tx) => {
      await tx.insert(chats).values(input.map(item => ({
        ...item,
        activeStreamId: null,
        userId: context.user.id,
      })))

      return { txid: await generateTxId(tx) }
    })
  })
