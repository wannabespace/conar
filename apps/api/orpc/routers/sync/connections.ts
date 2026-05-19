import { db } from '@conar/db'
import { connections, connectionsSelectSchema } from '@conar/db/schema'
import { decrypt } from '@conar/shared/utils/encryption'
import { eventIterator } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, createSyncPublisher, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(connectionsSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:connections:')

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(eventIterator(output))
  .handler(async function* ({ input, context, signal, lastEventId }) {
    const { updatedItems, newItems, missingIds } = await syncDiff({
      input,
      queries: {
        updated: items => db.select().from(connections).where(
          and(
            eq(connections.userId, context.user.id),
            or(...items.map(c =>
              and(eq(connections.id, c.id), gte(connections.updatedAt, addSeconds(c.updatedAt, 1))),
            )),
          ),
        ),
        new: excludeIds => db.select().from(connections).where(and(
          eq(connections.userId, context.user.id),
          notInArray(connections.id, excludeIds),
        )),
        existing: includeIds => db.select({ id: connections.id }).from(connections).where(and(
          eq(connections.userId, context.user.id),
          inArray(connections.id, includeIds),
        )).then(r => r.map(i => i.id)),
      },
    })

    const secret = await context.getUserSecret()
    const transform = (item: typeof connections.$inferSelect) => ({
      ...item,
      connectionString: decrypt({ encryptedText: item.connectionString, secret }),
    })

    for (const item of updatedItems) yield { type: 'update', value: transform(item) }
    for (const item of newItems) yield { type: 'insert', value: transform(item) }
    for (const id of missingIds) yield { type: 'delete', value: id }
    yield { type: 'synced' }

    for await (const { clientId, ...payload } of publisher.subscribe('event', { signal, lastEventId })) {
      if (clientId && clientId === context.clientId)
        continue
      yield payload
    }
  })
