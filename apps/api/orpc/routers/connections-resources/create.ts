import { db } from '@conar/db'
import {
  connections,
  connectionsResources,
  connectionsResourcesInsertSchema,
} from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const schema = connectionsResourcesInsertSchema

export const create = orpc
  .use(authMiddleware)
  .input(type.or(schema, schema.array()).pipe(data => (Array.isArray(data) ? data : [data])))
  .handler(async ({ context, input }) => {
    const connectionIds = input.map(item => item.connectionId)
    const foundConnections = await db
      .select({ id: connections.id })
      .from(connections)
      .where(and(inArray(connections.id, connectionIds), eq(connections.userId, context.user.id)))

    if (foundConnections.length === 0) {
      throw new ORPCError('NOT_FOUND', { message: 'Connections not found' })
    }

    const inserted = await db
      .insert(connectionsResources)
      .values(input)
      .onConflictDoNothing()
      .returning()

    for (const resource of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: resource,
      })
    }
  })
