import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, getColumns, gt, inArray, notInArray, or } from 'drizzle-orm'
import { db } from '~/drizzle'
import { connections, connectionsResources, connectionsResourcesSelectSchema } from '~/drizzle/schema'
import { authMiddleware, orpc } from '~/orpc'

const output = type.or(
  type({
    type: '"insert"',
    value: connectionsResourcesSelectSchema,
  }),
  type({
    type: '"update"',
    value: connectionsResourcesSelectSchema,
  }),
  type({
    type: '"delete"',
    value: 'string.uuid.v7',
  }),
).array()

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(output)
  .handler(async function ({ input, context }) {
    const inputIds = input.map(i => i.id)
    const [updatedItems, newItems, existingIds] = await Promise.all([
      inputIds.length > 0
        ? db.select(getColumns(connectionsResources))
            .from(connectionsResources)
            .innerJoin(connections, eq(connectionsResources.connectionId, connections.id))
            .where(
              and(
                eq(connections.userId, context.user.id),
                or(...input.map(connectionResource =>
                  and(eq(connectionsResources.id, connectionResource.id), gt(connectionsResources.updatedAt, addSeconds(connectionResource.updatedAt, 1))),
                )),
              ),
            )
        : [],
      db
        .select(getColumns(connectionsResources))
        .from(connectionsResources)
        .innerJoin(connections, eq(connectionsResources.connectionId, connections.id))
        .where(and(
          eq(connections.userId, context.user.id),
          notInArray(connectionsResources.id, inputIds),
        )),
      db
        .select({ id: connectionsResources.id })
        .from(connectionsResources)
        .innerJoin(connections, eq(connectionsResources.connectionId, connections.id))
        .where(and(
          eq(connections.userId, context.user.id),
          inArray(connectionsResources.id, inputIds),
        ))
        .then(r => r.map(item => item.id)),
    ])
    const missingIds = inputIds.filter(id => !existingIds.includes(id))
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
        value: item,
      })
    })

    return sync
  })
