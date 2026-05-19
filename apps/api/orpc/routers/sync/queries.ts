import { db } from '@conar/db'
import { queries, queriesSelectSchema } from '@conar/db/schema'
import { eventIterator } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gt, inArray, notInArray, or } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, createSyncPublisher, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(queriesSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:queries:')

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
        updated: items => db.select().from(queries).where(
          and(
            eq(queries.userId, context.user.id),
            or(...items.map(q =>
              and(eq(queries.id, q.id), gt(queries.updatedAt, addSeconds(q.updatedAt, 1))),
            )),
          ),
        ),
        new: excludeIds => db.select().from(queries).where(and(
          eq(queries.userId, context.user.id),
          notInArray(queries.id, excludeIds),
        )),
        existing: includeIds => db.select({ id: queries.id }).from(queries).where(and(
          eq(queries.userId, context.user.id),
          inArray(queries.id, includeIds),
        )).then(r => r.map(i => i.id)),
      },
    })

    for (const item of updatedItems) yield { type: 'update', value: item }
    for (const item of newItems) yield { type: 'insert', value: item }
    for (const id of missingIds) yield { type: 'delete', value: id }
    yield { type: 'synced' }

    for await (const { clientId, ...payload } of publisher.subscribe('event', { signal, lastEventId })) {
      if (clientId && clientId === context.clientId)
        continue
      yield payload
    }
  })
