import { db } from '@tamery/db'
import { shares } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

export const remove = orpc
  .use(authMiddleware)
  .input(type({ id: 'string.uuid' }))
  .handler(async ({ context, input }) => {
    await db
      .delete(shares)
      .where(and(eq(shares.id, input.id), eq(shares.userId, context.user.id)))
  })
