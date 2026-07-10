import { db } from '@conar/db'
import { connectionsResources } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { inArray } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const input = type({
  id: 'string.uuid.v7',
})

export const remove = orpc
  .use(authMiddleware)
  .input(type.or(input, input.array()).pipe((data) => (Array.isArray(data) ? data : [data])))
  .handler(async ({ context, input }) => {
    if (input.length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No connection resources to remove' })
    }

    const resources = await db.query.connectionsResources.findMany({
      columns: {
        id: true,
      },
      where: {
        id: {
          in: input.map((item) => item.id),
        },
        connection: {
          userId: {
            eq: context.user.id,
          },
        },
      },
    })

    if (resources.length !== input.length) {
      throw new ORPCError('NOT_FOUND', { message: 'Some connection resources not found' })
    }

    await db.delete(connectionsResources).where(
      inArray(
        connectionsResources.id,
        input.map((item) => item.id),
      ),
    )

    for (const item of input) {
      publisher.publish(context.user.id, {
        type: 'delete',
        key: item.id,
      })
    }
  })
