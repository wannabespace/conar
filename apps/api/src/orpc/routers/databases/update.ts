import { TRPCError } from '@trpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { databases, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const update = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string',
    name: 'string',
  }))
  .handler(async ({ context, input }) => {
    const [database] = await db.select().from(databases).where(eq(databases.id, input.id)).limit(1)

    if (!database) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Database not found' })
    }

    if (database.userId !== context.user.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    await db.update(databases).set({ name: input.name }).where(eq(databases.id, input.id))
  })
