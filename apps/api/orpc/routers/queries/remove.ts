import { db } from '@tamery/db'
import { queries } from '@tamery/db/schema/queries'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const remove = orpc
  .use(authMiddleware)
  .input(type({ id: 'string.uuid.v7' }))
  .handler(async ({ context, input }) => {
    await db
      .delete(queries)
      .where(and(eq(queries.userId, context.user.id), eq(queries.id, input.id)))

    publisher.publish(context.user.id, {
      key: input.id,
      type: 'delete',
    })
  })
