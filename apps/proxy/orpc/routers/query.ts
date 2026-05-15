import { db } from '@conar/db'
import { memoize } from '@conar/memoize'
import { createQueryRouter } from '@conar/query-proxy'
import { SyncType } from '@conar/shared/enums/sync-type'
import { decrypt } from '@conar/shared/utils/encryption'
import { ORPCError } from '@orpc/server'
import { authMiddleware, orpc } from '~/orpc'

const resolveQueryConnectionString = memoize(async ({
  input,
  userId,
  getUserSecret,
}: {
  input: { connectionString?: string, resourceId?: string, connectionId?: string }
  userId: string
  getUserSecret: () => Promise<string>
}) => {
  let connectionString = input.connectionString

  if (connectionString) {
    return connectionString
  }

  if (input.resourceId) {
    const [connection, secret] = await Promise.all([
      db.query.connectionsResources.findFirst({
        columns: {},
        where: {
          id: {
            eq: input.resourceId,
          },
        },
        with: {
          connection: {
            columns: {
              connectionString: true,
              syncType: true,
              isPasswordExists: true,
            },
            where: {
              userId: {
                eq: userId,
              },
            },
          },
        },
      }),
      getUserSecret(),
    ])

    if (!connection || !connection.connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    if (connection.connection.syncType === SyncType.CloudWithoutPassword && connection.connection.isPasswordExists) {
      throw new ORPCError('FORBIDDEN', { message: 'This connection is not allowed to be used because it was created as a cloud connection without a password.' })
    }

    connectionString = decrypt({ encryptedText: connection.connection.connectionString, secret })
  }

  if (input.connectionId) {
    const connection = await db.query.connections.findFirst({
      columns: {
        connectionString: true,
        syncType: true,
        isPasswordExists: true,
      },
      where: {
        id: {
          eq: input.connectionId,
        },
        userId: {
          eq: userId,
        },
      },
    })

    if (!connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    if (connection.syncType === SyncType.CloudWithoutPassword && connection.isPasswordExists) {
      throw new ORPCError('FORBIDDEN', { message: 'This connection is not allowed to be used because it was created as a cloud connection without a password.' })
    }

    connectionString = decrypt({ encryptedText: connection.connectionString, secret: await getUserSecret() })
  }

  return connectionString!
}, {
  maxAge: 1000 * 60 * 5, // 5 minutes
})

export const query = createQueryRouter(
  orpc.use(authMiddleware),
  (input, context) => resolveQueryConnectionString({ input, userId: context.user.id, getUserSecret: context.getUserSecret }),
)
