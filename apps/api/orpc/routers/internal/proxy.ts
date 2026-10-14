import { connectionSecrets } from '@tamery/connection/secrets'
import { db } from '@tamery/db'
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

const CONNECTION_COLUMNS = {
  connectionString: true,
  isPasswordExists: true,
  syncType: true,
  workspaceId: true,
} as const

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
          'This connection is not allowed to be used because its secrets or connection string are not stored in the cloud.',
      },
      NOT_FOUND: { message: 'Connection not found' },
    })
    .handler(async ({ context, errors, input }) => {
      if (input.connectionString) {
        return input.connectionString
      }
      if (!input.resourceId && !input.connectionId) {
        throw errors.BAD_REQUEST()
      }

      const resource = input.resourceId
        ? await db.query.connectionsResources.findFirst({
            columns: { name: true },
            where: { id: { eq: input.resourceId } },
            with: {
              connection: {
                columns: CONNECTION_COLUMNS,
                where: { userId: { eq: context.user.id } },
              },
            },
          })
        : undefined
      const connection = input.resourceId
        ? resource?.connection
        : await db.query.connections.findFirst({
            columns: CONNECTION_COLUMNS,
            where: {
              id: { eq: input.connectionId },
              userId: { eq: context.user.id },
            },
          })

      if (!connection) {
        throw errors.NOT_FOUND()
      }
      if (!connection.connectionString) {
        throw errors.FORBIDDEN()
      }

      const connectionString = await context.decryptConnectionString({
        encryptedText: connection.connectionString,
        workspaceId: connection.workspaceId,
      })
      const url = new SafeURL(connectionString)
      if (
        connection.syncType === SyncType.CloudWithoutSecrets &&
        (connection.isPasswordExists ||
          connectionSecrets.missing(url.searchParams).length > 0)
      ) {
        throw errors.FORBIDDEN()
      }

      if (!resource) {
        return connectionString
      }
      url.pathname = encodeURIComponent(resource.name || '')
      return url.toString()
    }),
}
