import { db } from '@tamery/db'
import { connections } from '@tamery/db/schema'
import { decrypt } from '@tamery/shared/crypto-node'
import { and, desc, eq, isNotNull } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .errors({
    INTERNAL_SERVER_ERROR: { message: 'Failed to decrypt connection string' },
  })
  .handler(async ({ context, errors }) => {
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
      .where(
        and(
          eq(connections.userId, context.user.id),
          isNotNull(connections.connectionString)
        )
      )
      .orderBy(desc(connections.createdAt))

    return Promise.all(
      connectionsList.map(
        async ({ connectionString, workspaceId, ...connection }) => {
          if (!connectionString) {
            throw errors.INTERNAL_SERVER_ERROR()
          }

          const secret = await context.getWorkspaceSecret(workspaceId)

          try {
            return {
              ...connection,
              connectionString: decrypt({
                encryptedText: connectionString,
                secret,
              }),
            }
          } catch {
            throw errors.INTERNAL_SERVER_ERROR()
          }
        }
      )
    )
  })
