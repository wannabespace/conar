import { db } from '@conar/db'
import { queries } from '@conar/db/schema/queries'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { publisher } from '../sync/queries'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      return
    }

    await db
      .delete(queries)
      .where(
        and(
          eq(queries.userId, context.session.userId),
          inArray(queries.id, input.map(item => item.id)),
        ),
      )
      .returning()

    for (const item of input) {
      publisher.publish('event', {
        type: 'delete',
        value: item.id,
        clientId: context.clientId,
      })
    }
  })
