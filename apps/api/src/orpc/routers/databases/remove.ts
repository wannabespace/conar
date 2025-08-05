import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { databases, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const remove = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid',
  }))
  .handler(async ({ context, input }) => {
    await db.delete(databases).where(and(eq(databases.id, input.id), eq(databases.userId, context.user.id)))
  })
