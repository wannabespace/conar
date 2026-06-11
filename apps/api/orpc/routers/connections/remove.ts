import { db } from '@conar/db'
import { connections } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { generateTxId } from '~/lib/electric'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  id: 'string.uuid',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No connections to remove' })
    }

    return db.transaction(async (tx) => {
      await tx
        .delete(connections)
        .where(and(
          inArray(connections.id, input.map(item => item.id)),
          eq(connections.userId, context.user.id),
        ))

      return { txid: await generateTxId(tx) }
    })
  })
