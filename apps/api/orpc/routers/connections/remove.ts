import { db } from '@tamery/db'
import { connections } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const remove = orpc
  .use(authMiddleware)
  .input(type({ id: 'string.uuid.v7' }))
  .handler(async ({ context, input }) => {
    await db
      .delete(connections)
      .where(
        and(
          eq(connections.id, input.id),
          eq(connections.userId, context.user.id)
        )
      )

    publisher.publish(context.user.id, {
      key: input.id,
      type: 'delete',
    })
  })
