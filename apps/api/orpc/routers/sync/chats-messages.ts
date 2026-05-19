import { db } from '@conar/db'
import { chats, chatsMessages, chatsMessagesSelectSchema } from '@conar/db/schema'
import { eventIterator } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, getColumns, gt, inArray, notInArray, or } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, createSyncPublisher, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(chatsMessagesSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:chats-messages:')

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
        updated: items => db
          .select(getColumns(chatsMessages))
          .from(chatsMessages)
          .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
          .where(
            and(
              eq(chats.userId, context.user.id),
              or(...items.map(m =>
                and(eq(chatsMessages.id, m.id), gt(chatsMessages.updatedAt, addSeconds(m.updatedAt, 1))),
              )),
            ),
          ),
        new: excludeIds => db
          .select(getColumns(chatsMessages))
          .from(chatsMessages)
          .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
          .where(and(
            eq(chats.userId, context.user.id),
            notInArray(chatsMessages.id, excludeIds),
          )),
        existing: includeIds => db
          .select({ id: chatsMessages.id })
          .from(chatsMessages)
          .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
          .where(and(
            eq(chats.userId, context.user.id),
            inArray(chatsMessages.id, includeIds),
          ))
          .then(r => r.map(i => i.id)),
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
