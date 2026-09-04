import { db } from '@tamery/db'
import {
  connectionsResources,
  connectionsResourcesUpdateSchema,
} from '@tamery/db/schema'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const update = orpc
  .use(authMiddleware)
  .input(
    type.and(
      connectionsResourcesUpdateSchema.omit(
        'createdAt',
        'updatedAt',
        'id',
        'connectionId'
      ),
      connectionsResourcesUpdateSchema.pick('id').required()
    )
  )
  .errors({
    NOT_FOUND: { message: 'Connection resource not found' },
  })
  .handler(async ({ context, errors, input }) => {
    const { id, ...changes } = input

    const found = await db.query.connectionsResources.findFirst({
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

    if (!found) {
      throw errors.NOT_FOUND()
    }

    const [resource] = await db
      .update(connectionsResources)
      .set(changes)
      .where(eq(connectionsResources.id, id))
      .returning()

    if (!resource) {
      throw errors.NOT_FOUND({
        message: 'Connection resource not found after update',
      })
    }

    publisher.publish(context.user.id, {
      type: 'update',
      value: resource,
    })
  })
