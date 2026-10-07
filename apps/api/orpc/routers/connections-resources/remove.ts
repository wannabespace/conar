import { db } from '@tamery/db'
import { connectionsResources } from '@tamery/db/schema'
import { type } from 'arktype'
import { inArray } from 'drizzle-orm'

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
    const owned = await db.query.connectionsResources.findMany({
      columns: {
        id: true,
      },
      where: {
        connection: {
          userId: {
            eq: context.user.id,
          },
        },
        id: {
          in: items.map((item) => item.id),
        },
      },
    })
    const ids = owned.map((resource) => resource.id)

    await db
      .delete(connectionsResources)
      .where(inArray(connectionsResources.id, ids))

    for (const id of ids) {
      publisher.publish(context.user.id, { key: id, type: 'delete' })
    }
  })
