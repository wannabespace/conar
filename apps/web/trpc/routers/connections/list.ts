import { desc, eq } from 'drizzle-orm'
import { connections, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => {
    return await db
      .select({
        id: connections.id,
        name: connections.name,
        type: connections.type,
      })
      .from(connections)
      .where(eq(connections.userId, ctx.user.id))
      .orderBy(desc(connections.createdAt))
  })
