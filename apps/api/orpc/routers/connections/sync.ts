import { decrypt } from '@conar/shared/utils/encryption'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gt, inArray, notInArray, or } from 'drizzle-orm'
import { connections, connectionsSelectSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

const output = type.or(
  type({
    type: '"insert"',
    value: connectionsSelectSchema,
  }),
  type({
    type: '"update"',
    value: connectionsSelectSchema,
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
        ? db.select().from(connections).where(
            and(
              eq(connections.userId, context.user.id),
              or(...input.map(connection =>
                and(eq(connections.id, connection.id), gt(connections.updatedAt, addSeconds(connection.updatedAt, 1))),
              )),
            ),
          )
        : [],
      db
        .select()
        .from(connections)
        .where(and(
          eq(connections.userId, context.user.id),
          notInArray(connections.id, inputIds),
        )),
      db
        .select({ id: connections.id })
        .from(connections)
        .where(and(
          eq(connections.userId, context.user.id),
          inArray(connections.id, inputIds),
        ))
        .then(r => r.map(item => item.id)),
    ])
    const missingIds = inputIds.filter(id => !existingIds.includes(id))
    const secret = await context.getUserSecret()
    const sync: typeof output.infer = []

    updatedItems.forEach((item) => {
      sync.push({
        type: 'update',
        value: {
          ...item,
          connectionString: decrypt({ encryptedText: item.connectionString, secret }),
        },
      })
    })

    newItems.forEach((item) => {
      sync.push({
        type: 'insert',
        value: {
          ...item,
          connectionString: decrypt({ encryptedText: item.connectionString, secret }),
        },
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
