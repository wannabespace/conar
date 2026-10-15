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
    .input(type({ resourceId: 'string' }).or({ connectionId: 'string' }))
    .errors({
      FORBIDDEN: {
        message:
          'This connection is not allowed to be used because its secrets or connection string are not stored in the cloud.',
      },
      NOT_FOUND: { message: 'Connection not found' },
    })
    .handler(async ({ context, errors, input }) => {
      const { connection, database } =
        'resourceId' in input
          ? await db.query.connectionsResources
              .findFirst({
                columns: { name: true },
                where: { id: { eq: input.resourceId } },
                with: {
                  connection: {
                    columns: CONNECTION_COLUMNS,
                    where: { userId: { eq: context.user.id } },
                  },
                },
              })
              .then((resource) => ({
                connection: resource?.connection,
                database: resource?.name ?? '',
              }))
          : {
              connection: await db.query.connections.findFirst({
                columns: CONNECTION_COLUMNS,
                where: {
                  id: { eq: input.connectionId },
                  userId: { eq: context.user.id },
                },
              }),
              database: undefined,
            }

      if (!connection) {
        throw errors.NOT_FOUND()
      }
      const withoutSecrets =
        connection.syncType === SyncType.CloudWithoutSecrets
      if (
        !connection.connectionString ||
        (withoutSecrets && connection.isPasswordExists)
      ) {
        throw errors.FORBIDDEN()
      }

      const connectionString = await context.decryptConnectionString({
        encryptedText: connection.connectionString,
        workspaceId: connection.workspaceId,
      })
      const url = new SafeURL(connectionString)
      if (
        withoutSecrets &&
        connectionSecrets.missing(url.searchParams).length > 0
      ) {
        throw errors.FORBIDDEN()
      }

      if (database === undefined) {
        return connectionString
      }
      url.pathname = encodeURIComponent(database)
      return url.toString()
    }),
}
