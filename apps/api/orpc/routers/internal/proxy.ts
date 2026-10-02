import { db } from '@tamery/db'
import { decrypt } from '@tamery/shared/crypto-node'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/safe-url'
import { type } from 'arktype'

import { env } from '~/env'
import { authMiddleware, orpc } from '~/orpc'

const proxySecretMiddleware = orpc
  .errors({
    FORBIDDEN: { message: 'Invalid proxy token' },
  })
  .middleware(({ context, errors, next }) => {
    const token = context.headers.get('x-proxy-token')

    if (token !== env.PROXY_SHARED_SECRET) {
      throw errors.FORBIDDEN()
    }

    return next()
  })

export const proxy = {
  resolveConnectionString: orpc
    .use(proxySecretMiddleware)
    .use(authMiddleware)
    .input(
      type({
        'connectionId?': 'string',
        'connectionString?': 'string',
        'resourceId?': 'string',
      })
    )
    .errors({
      BAD_REQUEST: {
        message:
          'One of connectionString, resourceId, or connectionId is required',
      },
      FORBIDDEN: {
        message:
          'This connection is not allowed to be used because its password or connection string is not stored in the cloud.',
      },
      NOT_FOUND: { message: 'Connection not found' },
    })
    .handler(async ({ context, errors, input }) => {
      if (input.connectionString) {
        return input.connectionString
      }

      if (input.resourceId) {
        const connection = await db.query.connectionsResources.findFirst({
          columns: { name: true },
          where: {
            id: { eq: input.resourceId },
          },
          with: {
            connection: {
              columns: {
                connectionString: true,
                isPasswordExists: true,
                syncType: true,
                workspaceId: true,
              },
              where: {
                userId: { eq: context.user.id },
              },
            },
          },
        })

        if (!connection || !connection.connection) {
          throw errors.NOT_FOUND()
        }

        if (
          !connection.connection.connectionString ||
          (connection.connection.syncType === SyncType.CloudWithoutPassword &&
            connection.connection.isPasswordExists)
        ) {
          throw errors.FORBIDDEN()
        }

        const url = new SafeURL(
          decrypt({
            encryptedText: connection.connection.connectionString,
            secret: await context.getWorkspaceSecret(
              connection.connection.workspaceId
            ),
          })
        )
        url.pathname = connection.name || ''
        return url.toString()
      }

      if (input.connectionId) {
        const connection = await db.query.connections.findFirst({
          columns: {
            connectionString: true,
            isPasswordExists: true,
            syncType: true,
            workspaceId: true,
          },
          where: {
            id: { eq: input.connectionId },
            userId: { eq: context.user.id },
          },
        })

        if (!connection) {
          throw errors.NOT_FOUND()
        }

        if (
          !connection.connectionString ||
          (connection.syncType === SyncType.CloudWithoutPassword &&
            connection.isPasswordExists)
        ) {
          throw errors.FORBIDDEN()
        }

        return decrypt({
          encryptedText: connection.connectionString,
          secret: await context.getWorkspaceSecret(connection.workspaceId),
        })
      }

      throw errors.BAD_REQUEST()
    }),
}
