import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { databases, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  id: 'string.uuid',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    await db
      .delete(databases)
      .where(and(
        inArray(databases.id, input.map(item => item.id)),
        eq(databases.userId, context.user.id),
      ))
  })
