import { desc, eq } from 'drizzle-orm'
import { db, members, workspaces } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => {
    return await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
      })
      .from(workspaces)
      .innerJoin(members, eq(members.workspaceId, workspaces.id))
      .where(eq(members.userId, ctx.user.id))
      .orderBy(desc(workspaces.createdAt))
  })
