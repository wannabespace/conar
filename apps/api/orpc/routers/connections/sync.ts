import { db } from '@conar/db'
import { connections, connectionsSelectSchema } from '@conar/db/schema'
import { decrypt } from '@conar/shared/utils/encryption'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'
import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(connectionsSelectSchema).array()

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
        updated: items => db.select().from(connections).where(
          and(
            eq(connections.userId, context.user.id),
            or(...items.map(c =>
              and(eq(connections.id, c.id), gte(connections.updatedAt, addSeconds(c.updatedAt, 1))),
            )),
          ),
        ),
        new: excludeIds => db.select().from(connections).where(and(
          eq(connections.userId, context.user.id),
          notInArray(connections.id, excludeIds),
        )),
        existing: includeIds => db.select({ id: connections.id }).from(connections).where(and(
          eq(connections.userId, context.user.id),
          inArray(connections.id, includeIds),
        )).then(r => r.map(i => i.id)),
      },
    })
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
        key: item,
      })
    })

    return sync
  })
