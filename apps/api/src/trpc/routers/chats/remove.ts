import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { chats, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const remove = protectedProcedure
  .input(type({
    id: 'string.uuid',
  }))
  .mutation(async ({ input, ctx }) => {
    await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, ctx.user.id)))
  })
