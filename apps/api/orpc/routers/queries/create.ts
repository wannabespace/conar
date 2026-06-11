import { db } from '@conar/db'
import { queriesInsertSchema } from '@conar/db/schema'
import { queries } from '@conar/db/schema/queries'
import { type } from 'arktype'
import { generateTxId } from '~/lib/electric'
import { authMiddleware, orpc } from '~/orpc'

const schema = queriesInsertSchema.omit('userId')

export const create = orpc
  .use(authMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    return db.transaction(async (tx) => {
      await tx
        .insert(queries)
        .values(input.map(item => ({
          ...item,
          userId: context.session.userId,
        })))

      return { txid: await generateTxId(tx) }
    })
  })
