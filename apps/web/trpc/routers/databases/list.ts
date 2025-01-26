import { desc, eq } from 'drizzle-orm'

import { databases, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => {
    return await db
      .select({
        id: databases.id,
        name: databases.name,
        type: databases.type,
      })
      .from(databases)
      .where(eq(databases.userId, ctx.user.id))
      .orderBy(desc(databases.createdAt))
  })
