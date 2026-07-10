import { db } from '@conar/db'
import { connectionsResources, connectionsResourcesUpdateSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const update = orpc
  .use(authMiddleware)
  .input(
    type.and(
      connectionsResourcesUpdateSchema.omit('createdAt', 'updatedAt', 'id', 'connectionId'),
      connectionsResourcesUpdateSchema.pick('id').required(),
    ),
  )
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input

    const found = await db.query.connectionsResources.findFirst({
      columns: {
        id: true,
      },
      where: {
        id: {
          eq: input.id,
        },
        connection: {
          userId: {
            eq: context.user.id,
          },
        },
      },
    })

    if (!found) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection resource not found' })
    }

    const [resource] = await db
      .update(connectionsResources)
      .set(changes)
      .where(eq(connectionsResources.id, id))
      .returning()

    publisher.publish(context.user.id, {
      type: 'update',
      value: resource!,
    })
  })
