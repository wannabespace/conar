import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~/drizzle'
import { queries } from '~/drizzle/schema/queries'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    await db
      .delete(queries)
      .where(
        and(
          eq(queries.userId, context.session.userId),
          inArray(queries.id, input.map(item => item.id)),
        ),
      )
  })
