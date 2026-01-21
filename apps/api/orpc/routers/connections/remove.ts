import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { connections, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const input = type({
  id: 'string.uuid',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      return
    }

    await db
      .delete(connections)
      .where(and(
        inArray(connections.id, input.map(item => item.id)),
        eq(connections.userId, context.user.id),
      ))
  })
