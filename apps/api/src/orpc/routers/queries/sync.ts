import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'
import { db, queries, queriesSelectSchema } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const output = type.or(
  type({
    type: '"insert"',
    value: queriesSelectSchema,
  }),
  type({
    type: '"update"',
    value: queriesSelectSchema,
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
        ? db.select().from(queries).where(
            and(
              eq(queries.userId, context.user.id),
              or(...input.map(query =>
                and(eq(queries.id, query.id), gte(queries.updatedAt, addSeconds(query.updatedAt, 1))),
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
