import { db } from '@tamery/db'
import {
  chats,
  chatsMessages,
  chatsMessagesParts,
  chatsMessagesPartsSelectSchema,
} from '@tamery/db/schema'
import { type } from 'arktype'
import { and, eq, getColumns, inArray, notInArray } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(chatsMessagesPartsSelectSchema).array()

const userParts = () =>
  db
    .select(getColumns(chatsMessagesParts))
    .from(chatsMessagesParts)
    .innerJoin(
      chatsMessages,
      eq(chatsMessagesParts.messageId, chatsMessages.id)
    )
    .innerJoin(chats, eq(chatsMessages.chatId, chats.id))

export const sync = orpc
  .use(authMiddleware)
  .input(
    type({
      id: 'string.uuid.v7',
      updatedAt: 'Date',
    }).array()
  )
  .output(output)
  .handler(async ({ input, context }) => {
    const { newItems, missingIds } = await syncDiff({
      input,
      queries: {
        existing: (includeIds) =>
          db
            .select({ id: chatsMessagesParts.id })
            .from(chatsMessagesParts)
            .innerJoin(
              chatsMessages,
              eq(chatsMessagesParts.messageId, chatsMessages.id)
            )
            .innerJoin(chats, eq(chatsMessages.chatId, chats.id))
            .where(
              and(
                eq(chats.userId, context.user.id),
                inArray(chatsMessagesParts.id, includeIds)
              )
            )
            .then((r) => r.map((i) => i.id)),
        new: (excludeIds) =>
          userParts().where(
            and(
              eq(chats.userId, context.user.id),
              notInArray(chatsMessagesParts.id, excludeIds)
            )
          ),
      },
    })

    const result: typeof output.infer = []

    for (const item of newItems) {
      result.push({
        type: 'insert',
        value: item,
      })
    }

    for (const item of missingIds) {
      result.push({
        key: item,
        type: 'delete',
      })
    }

    return result
  })
