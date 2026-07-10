import { db } from '@conar/db'
import { queries, queriesSelectSchema } from '@conar/db/schema'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(queriesSelectSchema).array()

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
        updated: items =>
          db
            .select()
            .from(queries)
            .where(
              and(
                eq(queries.userId, context.user.id),
                or(
                  ...items.map(q =>
                    and(eq(queries.id, q.id), gte(queries.updatedAt, addSeconds(q.updatedAt, 1))),
                  ),
                ),
              ),
            ),
        new: excludeIds =>
          db
            .select()
            .from(queries)
            .where(and(eq(queries.userId, context.user.id), notInArray(queries.id, excludeIds))),
        existing: includeIds =>
          db
            .select({ id: queries.id })
            .from(queries)
            .where(and(eq(queries.userId, context.user.id), inArray(queries.id, includeIds)))
            .then(r => r.map(i => i.id)),
      },
    })

    const sync: typeof output.infer = []

    updatedItems.forEach(item => {
      sync.push({
        type: 'update',
        value: item,
      })
    })

    newItems.forEach(item => {
      sync.push({
        type: 'insert',
        value: item,
      })
    })

    missingIds.forEach(item => {
      sync.push({
        type: 'delete',
        key: item,
        // @ts-expect-error TODO: remove this in future, currently saved for backward compatibility
        value: item,
      })
    })

    return sync
  })
