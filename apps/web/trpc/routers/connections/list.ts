import { desc, eq } from 'drizzle-orm'
import { connections, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => db
    .select({
      id: connections.id,
      name: connections.name,
      type: connections.type,
      createdAt: connections.createdAt,
    })
    .from(connections)
    .where(eq(connections.userId, ctx.user.id))
    .orderBy(desc(connections.createdAt)),
  )
