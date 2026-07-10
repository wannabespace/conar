import { db } from '@conar/db'
import { SyncType } from '@conar/shared/enums/sync-type'
import { decrypt } from '@conar/shared/utils/crypto-node'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'

import { env } from '~/env'
import { authMiddleware, orpc } from '~/orpc'

const proxySecretMiddleware = orpc.middleware(({ context, next }) => {
  const token = context.headers.get('x-proxy-token')

  if (token !== env.PROXY_SHARED_SECRET) {
    throw new ORPCError('FORBIDDEN', { message: 'Invalid proxy token' })
  }

  return next()
})

export const proxy = {
  resolveConnectionString: orpc
    .use(proxySecretMiddleware)
    .use(authMiddleware)
    .input(
      type({
        'connectionString?': 'string',
        'resourceId?': 'string',
        'connectionId?': 'string',
      }),
    )
    .handler(async ({ input, context }) => {
      if (input.connectionString) {
        return input.connectionString
      }

      if (input.resourceId) {
        const [connection, secret] = await Promise.all([
          db.query.connectionsResources.findFirst({
            columns: {},
            where: {
              id: { eq: input.resourceId },
            },
            with: {
              connection: {
                columns: {
                  connectionString: true,
                  syncType: true,
                  isPasswordExists: true,
                },
                where: {
                  userId: { eq: context.user.id },
                },
              },
            },
          }),
          context.getUserSecret(),
        ])

        if (!connection || !connection.connection) {
          throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
        }

        if (connection.connection.syncType === SyncType.CloudWithoutPassword && connection.connection.isPasswordExists) {
          throw new ORPCError('FORBIDDEN', {
            message: 'This connection is not allowed to be used because it was created as a cloud connection without a password.',
          })
        }

        return decrypt({ encryptedText: connection.connection.connectionString, secret })
      }

      if (input.connectionId) {
        const [connection, secret] = await Promise.all([
          db.query.connections.findFirst({
            columns: {
              connectionString: true,
              syncType: true,
              isPasswordExists: true,
            },
            where: {
              id: { eq: input.connectionId },
              userId: { eq: context.user.id },
            },
          }),
          context.getUserSecret(),
        ])

        if (!connection) {
          throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
        }

        if (connection.syncType === SyncType.CloudWithoutPassword && connection.isPasswordExists) {
          throw new ORPCError('FORBIDDEN', {
            message: 'This connection is not allowed to be used because it was created as a cloud connection without a password.',
          })
        }

        return decrypt({ encryptedText: connection.connectionString, secret })
      }

      throw new ORPCError('BAD_REQUEST', {
        message: 'One of connectionString, resourceId, or connectionId is required',
      })
    }),
}
