import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { databases, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const remove = protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
  }))
  .mutation(async ({ input, ctx }) => {
    await db.delete(databases).where(and(eq(databases.id, input.id), eq(databases.userId, ctx.user.id)))
  })
