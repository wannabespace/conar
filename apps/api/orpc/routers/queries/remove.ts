import { db } from '@conar/db'
import { queries } from '@conar/db/schema/queries'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { generateTxId } from '~/lib/electric'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No queries to remove' })
    }

    return db.transaction(async (tx) => {
      await tx
        .delete(queries)
        .where(
          and(
            eq(queries.userId, context.session.userId),
            inArray(queries.id, input.map(item => item.id)),
          ),
        )

      return { txid: await generateTxId(tx) }
    })
  })
