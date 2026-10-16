import { db } from '@tamery/db'
import { connectionsResources } from '@tamery/db/schema'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const remove = orpc
  .use(authMiddleware)
  .input(type({ id: 'string.uuid.v7' }))
  .handler(async ({ context, input: { id } }) => {
    const owned = await db.query.connectionsResources.findFirst({
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
          eq: id,
        },
      },
    })

    if (!owned) {
      return
    }

    await db.delete(connectionsResources).where(eq(connectionsResources.id, id))

    publisher.publish(context.user.id, { key: id, type: 'delete' })
  })
