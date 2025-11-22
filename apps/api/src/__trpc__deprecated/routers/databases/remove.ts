import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { protectedProcedure } from '~/__trpc__deprecated'
import { databases, db } from '~/drizzle'

export const remove = protectedProcedure
  .input(type({
    id: 'string.uuid',
  }))
  .mutation(async ({ input, ctx }) => {
    await db.delete(databases).where(and(eq(databases.id, input.id), eq(databases.userId, ctx.user.id)))
  })
