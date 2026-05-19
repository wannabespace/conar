import { db } from '@conar/db'
import { chats, chatsSelectSchema } from '@conar/db/schema'
import { eventIterator } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gt, inArray, notInArray, or } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, createSyncPublisher, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(chatsSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:chats:')

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
        updated: items => db.select().from(chats).where(
          and(
            eq(chats.userId, context.user.id),
            or(...items.map(c =>
              and(eq(chats.id, c.id), gt(chats.updatedAt, addSeconds(c.updatedAt, 1))),
            )),
          ),
        ),
        new: excludeIds => db.select().from(chats).where(and(
          eq(chats.userId, context.user.id),
          notInArray(chats.id, excludeIds),
        )),
        existing: includeIds => db.select({ id: chats.id }).from(chats).where(and(
          eq(chats.userId, context.user.id),
          inArray(chats.id, includeIds),
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
