import { db } from '@tamery/db'
import { connectionsResources } from '@tamery/db/schema'
import { type } from 'arktype'
import { inArray } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(
    type
      .or(input, input.array())
      .pipe((data) => (Array.isArray(data) ? data : [data]))
  )
  .errors({
    BAD_REQUEST: { message: 'No connection resources to remove' },
    NOT_FOUND: { message: 'Some connection resources not found' },
  })
  .handler(async ({ context, errors, input: items }) => {
    if (items.length === 0) {
      throw errors.BAD_REQUEST()
    }

    const resources = await db.query.connectionsResources.findMany({
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

    if (resources.length !== items.length) {
      throw errors.NOT_FOUND()
    }

    await db.delete(connectionsResources).where(
      inArray(
        connectionsResources.id,
        items.map((item) => item.id)
      )
    )

    for (const item of items) {
      publisher.publish(context.user.id, {
        key: item.id,
        type: 'delete',
      })
    }
  })
