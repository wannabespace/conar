import { db } from '@tamery/db'
import {
  connections,
  connectionsResources,
  connectionsResourcesInsertSchema,
} from '@tamery/db/schema'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(authMiddleware)
  .input(connectionsResourcesInsertSchema)
  .errors({
    NOT_FOUND: { message: 'Connection not found' },
  })
  .handler(async ({ context, errors, input }) => {
    const [connection] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(
        and(
          eq(connections.id, input.connectionId),
          eq(connections.userId, context.user.id)
        )
      )
      .limit(1)

    if (!connection) {
      throw errors.NOT_FOUND()
    }

    const [inserted] = await db
      .insert(connectionsResources)
      .values(input)
      .onConflictDoNothing()
      .returning()

    if (inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: inserted,
      })
    }
  })
