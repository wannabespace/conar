import { eventIterator } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gt, inArray, notInArray, or } from 'drizzle-orm'
import { db, queries, queriesSelectSchema } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const entityUpdatesSchema = type.or(
  type({
    type: '"insert"',
    value: queriesSelectSchema,
  }),
  type({
    type: '"update"',
    value: queriesSelectSchema.partial(),
  }),
  type({
    type: '"delete"',
    value: 'string.uuid.v7',
  }),
)

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(eventIterator(type({
    type: '"sync"',
    data: entityUpdatesSchema.array(),
  })))
  .handler(async function* ({ input, context }) {
    const inputIds = input.map(i => i.id)
    const [updatedItems, newItems, allIds] = await Promise.all([
      inputIds.length > 0
        ? db.select().from(queries).where(
            and(
              eq(queries.userId, context.user.id),
              or(...input.map(query =>
                and(eq(queries.id, query.id), gt(queries.updatedAt, addSeconds(query.updatedAt, 1))),
              )),
            ),
          )
        : [],
      db
        .select()
        .from(queries)
        .where(and(
          eq(queries.userId, context.user.id),
          notInArray(queries.id, inputIds),
        )),
      db
        .select({ id: queries.id })
        .from(queries)
        .where(and(
          eq(queries.userId, context.user.id),
          inArray(queries.id, inputIds),
        ))
        .then(r => r.map(item => item.id)),
    ])
    const missingIds = inputIds.filter(id => !allIds.includes(id))

    const sync: typeof entityUpdatesSchema.infer[] = []

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

    yield {
      type: 'sync' as const,
      data: sync,
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  })
