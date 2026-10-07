import { db } from '@tamery/db'
import { queries } from '@tamery/db/schema/queries'
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
      .delete(queries)
      .where(and(eq(queries.userId, context.user.id), inArray(queries.id, ids)))

    for (const id of ids) {
      publisher.publish(context.user.id, { key: id, type: 'delete' })
    }
  })
