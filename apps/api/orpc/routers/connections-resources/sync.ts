import { db } from '@conar/db'
import {
  connections,
  connectionsResources,
  connectionsResourcesSelectSchema,
} from '@conar/db/schema'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, getColumns, gte, inArray, notInArray, or } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(connectionsResourcesSelectSchema).array()

export const sync = orpc
  .use(authMiddleware)
  .input(
    type({
      id: 'string.uuid.v7',
      updatedAt: 'Date',
    }).array(),
  )
  .output(output)
  .handler(async function ({ input, context }) {
    const { updatedItems, newItems, missingIds } = await syncDiff({
      input,
      queries: {
        updated: (items) =>
          db
            .select(getColumns(connectionsResources))
            .from(connectionsResources)
            .innerJoin(connections, eq(connectionsResources.connectionId, connections.id))
            .where(
              and(
                eq(connections.userId, context.user.id),
                or(
                  ...items.map((cr) =>
                    and(
                      eq(connectionsResources.id, cr.id),
                      gte(connectionsResources.updatedAt, addSeconds(cr.updatedAt, 1)),
                    ),
                  ),
                ),
              ),
            ),
        new: (excludeIds) =>
          db
            .select(getColumns(connectionsResources))
            .from(connectionsResources)
            .innerJoin(connections, eq(connectionsResources.connectionId, connections.id))
            .where(
              and(
                eq(connections.userId, context.user.id),
                notInArray(connectionsResources.id, excludeIds),
              ),
            ),
        existing: (includeIds) =>
          db
            .select({ id: connectionsResources.id })
            .from(connectionsResources)
            .innerJoin(connections, eq(connectionsResources.connectionId, connections.id))
            .where(
              and(
                eq(connections.userId, context.user.id),
                inArray(connectionsResources.id, includeIds),
              ),
            )
            .then((r) => r.map((i) => i.id)),
      },
    })
    const sync: typeof output.infer = []

    updatedItems.forEach((item) => {
      sync.push({
        type: 'update',
        value: item,
      })
    })

    newItems.forEach((item) => {
      sync.push({
        type: 'insert',
        value: item,
      })
    })

    missingIds.forEach((item) => {
      sync.push({
        type: 'delete',
        key: item,
        // @ts-expect-error TODO: remove this in future, currently saved for backward compatibility
        value: item,
      })
    })

    return sync
  })
