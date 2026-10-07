import { db } from '@tamery/db'
import { connections } from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const input = type({ id: 'string.uuid.v7' })

export const remove = orpc
  .use(authMiddleware)
  // Installed desktop builds still send an array; keep accepting it.
  .input(
    type
      .or(input, input.array())
      .pipe((data) => (Array.isArray(data) ? data : [data]))
  )
  .handler(async ({ context, input: items }) => {
    const ids = items.map((item) => item.id)

    await db
      .delete(connections)
      .where(
        and(
          inArray(connections.id, ids),
          eq(connections.userId, context.user.id)
        )
      )

    for (const id of ids) {
      publisher.publish(context.user.id, { key: id, type: 'delete' })
    }
  })
