import { decrypt } from '@conar/shared/encryption'
import { eventIterator } from '@orpc/server'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gt, inArray, notInArray, or } from 'drizzle-orm'
import { databases, databasesSelectSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const entityUpdatesSchema = type.or(
  type({
    type: '"insert"',
    value: databasesSelectSchema,
  }),
  type({
    type: '"update"',
    value: databasesSelectSchema,
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
        ? db.select().from(databases).where(
            and(
              eq(databases.userId, context.user.id),
              or(...input.map(database =>
                and(eq(databases.id, database.id), gt(databases.updatedAt, addSeconds(database.updatedAt, 1))),
              )),
            ),
          )
        : [],
      db
        .select()
        .from(databases)
        .where(and(
          eq(databases.userId, context.user.id),
          notInArray(databases.id, inputIds),
        )),
      db
        .select({ id: databases.id })
        .from(databases)
        .where(and(
          eq(databases.userId, context.user.id),
          inArray(databases.id, inputIds),
        ))
        .then(r => r.map(item => item.id)),
    ])
    const missingIds = inputIds.filter(id => !allIds.includes(id))

    const sync: typeof entityUpdatesSchema.infer[] = []

    updatedItems.forEach((item) => {
      sync.push({
        type: 'update',
        value: {
          ...item,
          connectionString: decrypt({ encryptedText: item.connectionString, secret: context.user.secret }),
        },
      })
    })

    newItems.forEach((item) => {
      sync.push({
        type: 'insert',
        value: {
          ...item,
          connectionString: decrypt({ encryptedText: item.connectionString, secret: context.user.secret }),
        },
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
