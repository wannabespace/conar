import { db } from '@tamery/db'
import { connectionsResources } from '@tamery/db/schema'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const remove = orpc
  .use(authMiddleware)
  .input(type({ id: 'string.uuid.v7' }))
  .handler(async ({ context, input }) => {
    const resource = await db.query.connectionsResources.findFirst({
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
          eq: input.id,
        },
      },
    })

    if (!resource) {
      return
    }

    await db
      .delete(connectionsResources)
      .where(eq(connectionsResources.id, input.id))

    publisher.publish(context.user.id, {
      key: input.id,
      type: 'delete',
    })
  })
