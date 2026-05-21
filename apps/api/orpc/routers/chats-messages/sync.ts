import { db } from '@conar/db'
import { chats, chatsMessages, chatsMessagesSelectSchema } from '@conar/db/schema'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, getColumns, gt, inArray, notInArray, or } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(chatsMessagesSelectSchema).array()

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(output)
  .handler(async function ({ input, context }) {
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
        value: item.id,
      })
    })

    return sync
  })
