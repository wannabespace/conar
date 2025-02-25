import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { connections, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const remove = protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
  }))
  .mutation(async ({ input, ctx }) => {
    await db.delete(connections).where(and(eq(connections.id, input.id), eq(connections.userId, ctx.user.id)))
  })
