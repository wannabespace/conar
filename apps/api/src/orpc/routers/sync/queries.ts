import { eventIterator, EventPublisher } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'
import { db, queries, queriesSelectSchema } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const publisher = new EventPublisher<{
  action: {
    userId: string
  }& ({
    type: 'insert'
    value: typeof queriesSelectSchema.infer
  } | {
    type: 'update'
    value: typeof queriesSelectSchema.infer
  } | {
    type: 'delete'
    value: string
  })
}>()

const entityUpdatesSchema = type.or(
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
)

export const sync = orpc
  .use(authMiddleware)
  .input(type({
    id: 'string.uuid.v7',
    updatedAt: 'Date',
  }).array())
  .output(eventIterator(type.or(
    type({
      type: '"sync"',
      value: entityUpdatesSchema.array(),
    }),
    type({
      type: '"insert"',
      value: queriesSelectSchema,
    }),
    type({
      type: '"delete"',
      value: 'string.uuid.v7',
    }),
    type({
      type: '"update"',
      value: queriesSelectSchema,
    }),
  )))
  .handler(async function* ({ input, context, signal }) {
    const inputIds = input.map(i => i.id)
    const [updatedItems, newItems, allIds] = await Promise.all([
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
      value: sync,
    }

    for await (const payload of publisher.subscribe('action', { signal })) {
      if (payload.userId !== context.user.id) {
        continue
      }

      switch (payload.type) {
        case 'update':
          yield {
            type: 'update',
            value: payload.value,
          }
          break
        case 'insert':
          yield {
            type: 'insert',
            value: payload.value,
          }
          break
        case 'delete':
          yield {
            type: 'delete',
            value: payload.value,
          }
          break
      }
    }
  })
