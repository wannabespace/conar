import { db } from '@conar/db'
import { connections, connectionsResources, connectionsResourcesInsertSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq, inArray } from 'drizzle-orm'
import { generateTxId } from '~/lib/electric'
import { authMiddleware, orpc } from '~/orpc'

const schema = connectionsResourcesInsertSchema

export const create = orpc
  .use(authMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    const connectionIds = input.map(item => item.connectionId)
    const foundConnections = await db.select({ id: connections.id })
      .from(connections)
      .where(and(inArray(connections.id, connectionIds), eq(connections.userId, context.user.id)))

    if (foundConnections.length !== connectionIds.length) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    return db.transaction(async (tx) => {
      for (const item of input) {
        await tx.insert(connectionsResources).values(item).onConflictDoUpdate({
          target: [connectionsResources.connectionId, connectionsResources.name],
          set: item,
        })
      }

      return { txid: await generateTxId(tx) }
    })
  })
