import { db } from '@tamery/db'
import { chats, chatsSelectSchema } from '@tamery/db/schema'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(chatsSelectSchema).array()

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
    const { updatedItems, newItems, missingIds } = await syncDiff({
      input,
      queries: {
        existing: (includeIds) =>
          db
            .select({ id: chats.id })
            .from(chats)
            .where(
              and(
                eq(chats.userId, context.user.id),
                inArray(chats.id, includeIds)
              )
            )
            .then((r) => r.map((i) => i.id)),
        new: (excludeIds) =>
          db
            .select()
            .from(chats)
            .where(
              and(
                eq(chats.userId, context.user.id),
                notInArray(chats.id, excludeIds)
              )
            ),
        updated: (items) =>
          db
            .select()
            .from(chats)
            .where(
              and(
                eq(chats.userId, context.user.id),
                or(
                  ...items.map((c) =>
                    and(
                      eq(chats.id, c.id),
                      gte(chats.updatedAt, addSeconds(c.updatedAt, 1))
                    )
                  )
                )
              )
            ),
      },
    })

    const result: typeof output.infer = []

    for (const item of updatedItems) {
      result.push({
        type: 'update',
        value: item,
      })
    }

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
        // @ts-expect-error TODO: remove this in future, currently saved for backward compatibility
        value: item,
      })
    }

    return result
  })
