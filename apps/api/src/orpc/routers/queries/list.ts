import { desc, eq } from 'drizzle-orm'
import { db } from '~/drizzle'
import { queries } from '~/drizzle/schema/queries'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
    const result = await db
      .select()
      .from(queries)
      .where(eq(queries.userId, context.session.userId))
      .orderBy(desc(queries.createdAt))

    return result
  })
