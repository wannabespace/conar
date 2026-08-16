import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import { connections } from '@tamery/db/schema'
import { decrypt } from '@tamery/shared/utils/crypto-node'
import { desc, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

export const list = orpc.use(authMiddleware).handler(async ({ context }) => {
  const connectionsList = await db
    .select({
      connectionString: connections.connectionString,
      createdAt: connections.createdAt,
      id: connections.id,
      isPasswordExists: connections.isPasswordExists,
      name: connections.name,
      type: connections.type,
      updatedAt: connections.updatedAt,
      workspaceId: connections.workspaceId,
    })
    .from(connections)
    .where(eq(connections.userId, context.user.id))
    .orderBy(desc(connections.createdAt))

  return Promise.all(
    connectionsList.map(async ({ workspaceId, ...connection }) => {
      const secret = await context.getWorkspaceSecret(workspaceId)

      try {
        return {
          ...connection,
          connectionString: decrypt({
            encryptedText: connection.connectionString,
            secret,
          }),
        }
      } catch {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to decrypt connection string',
        })
      }
    })
  )
})
