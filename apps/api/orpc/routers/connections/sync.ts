import { db } from '@tamery/db'
import { connections, connectionsSelectSchema } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(connectionsSelectSchema).array()

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
            .select({ id: connections.id })
            .from(connections)
            .where(
              and(
                eq(connections.userId, context.user.id),
                inArray(connections.id, includeIds)
              )
            )
            .then((r) => r.map((i) => i.id)),
        new: (excludeIds) =>
          db
            .select()
            .from(connections)
            .where(
              and(
                eq(connections.userId, context.user.id),
                notInArray(connections.id, excludeIds)
              )
            ),
        updated: (items) =>
          db
            .select()
            .from(connections)
            .where(
              and(
                eq(connections.userId, context.user.id),
                or(
                  ...items.map((c) =>
                    and(
                      eq(connections.id, c.id),
                      gte(connections.updatedAt, addSeconds(c.updatedAt, 1))
                    )
                  )
                )
              )
            ),
      },
    })
    // An undecryptable string comes back as missing, so the app asks for it instead of failing the whole sync.
    const decryptItem = async (item: (typeof updatedItems)[number]) => {
      if (!item.connectionString) {
        return item
      }

      try {
        return {
          ...item,
          connectionString: await context.decryptConnectionString({
            encryptedText: item.connectionString,
            workspaceId: item.workspaceId,
          }),
        }
      } catch (error) {
        console.error(`Failed to decrypt connection ${item.id}`, error)
        return {
          ...item,
          connectionString: null,
          syncType: SyncType.CloudWithoutConnectionString,
        }
      }
    }
    const [updatedValues, newValues] = await Promise.all([
      Promise.all(updatedItems.map(decryptItem)),
      Promise.all(newItems.map(decryptItem)),
    ])
    const syncResult: typeof output.infer = []

    for (const value of updatedValues) {
      syncResult.push({ type: 'update', value })
    }

    for (const value of newValues) {
      syncResult.push({ type: 'insert', value })
    }

    for (const item of missingIds) {
      syncResult.push({
        key: item,
        type: 'delete',
      })
    }

    return syncResult
  })
