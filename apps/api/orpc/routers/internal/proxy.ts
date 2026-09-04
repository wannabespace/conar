import { db } from '@tamery/db'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { decrypt } from '@tamery/shared/utils/crypto-node'
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
          'This connection is not allowed to be used because it was created as a cloud connection without a password.',
      },
      NOT_FOUND: { message: 'Connection not found' },
    })
    .handler(async ({ context, errors, input }) => {
      if (input.connectionString) {
        return input.connectionString
      }

      if (input.resourceId) {
        const connection = await db.query.connectionsResources.findFirst({
          columns: {},
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
          connection.connection.syncType === SyncType.CloudWithoutPassword &&
          connection.connection.isPasswordExists
        ) {
          throw errors.FORBIDDEN()
        }

        return decrypt({
          encryptedText: connection.connection.connectionString,
          secret: await context.getWorkspaceSecret(
            connection.connection.workspaceId
          ),
        })
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
          connection.syncType === SyncType.CloudWithoutPassword &&
          connection.isPasswordExists
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
