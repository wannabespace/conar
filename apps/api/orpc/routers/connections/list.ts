import { ORPCError } from '@orpc/server'
import { db } from '@tamery/db'
import { connections } from '@tamery/db/schema'
import { decrypt } from '@tamery/shared/utils/crypto-node'
import { desc, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

export const list = orpc.use(authMiddleware).handler(async ({ context }) => {
  const list = await db
    .select({
      id: connections.id,
      name: connections.name,
      type: connections.type,
      isPasswordExists: connections.isPasswordExists,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
      connectionString: connections.connectionString,
    })
    .from(connections)
    .where(eq(connections.userId, context.user.id))
    .orderBy(desc(connections.createdAt))

  const secret = await context.getUserSecret()

  try {
    return list.map(connection =>
      Object.assign(connection, {
        connectionString: decrypt({ encryptedText: connection.connectionString, secret }),
      }),
    )
  } catch {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to decrypt connection string',
    })
  }
})
