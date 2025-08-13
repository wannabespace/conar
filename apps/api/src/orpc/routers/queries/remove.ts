import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { db } from '~/drizzle'
import { queries } from '~/drizzle/schema/queries'
import { authMiddleware, orpc } from '~/orpc'

export const remove = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
  }))
  .handler(async ({ context, input }) => {
    await db
      .delete(queries)
      .where(
        and(
          eq(queries.id, input.id),
          eq(queries.userId, context.session.userId),
        ),
      )
  })
