import { connectionSecrets } from '@tamery/connection/secrets'
import { resourceConnectionString } from '@tamery/connection/utils'
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

const findConnection = async (
  input: { resourceId: string } | { connectionId: string },
  userId: string
) => {
  if ('resourceId' in input) {
    const resource = await db.query.connectionsResources.findFirst({
      columns: { name: true },
      where: { id: { eq: input.resourceId } },
      with: {
        connection: {
          columns: CONNECTION_COLUMNS,
          where: { userId: { eq: userId } },
        },
      },
    })
    return { connection: resource?.connection, resource }
  }
  const connection = await db.query.connections.findFirst({
    columns: CONNECTION_COLUMNS,
    where: { id: { eq: input.connectionId }, userId: { eq: userId } },
  })
  return { connection, resource: undefined }
}

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
      const { connection, resource } = await findConnection(
        input,
        context.user.id
      )
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
      if (
        connection.syncType === SyncType.CloudWithoutSecrets &&
        (connection.isPasswordExists ||
          connectionSecrets.missing(new SafeURL(connectionString).searchParams)
            .length > 0)
      ) {
        throw errors.FORBIDDEN()
      }

      return resource
        ? resourceConnectionString(connectionString, resource.name)
        : connectionString
    }),
}
