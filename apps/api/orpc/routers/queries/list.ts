import { db } from '@conar/db'
import { queries } from '@conar/db/schema/queries'
import { desc, eq } from 'drizzle-orm'
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
