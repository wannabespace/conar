import { db } from '@conar/db'
import { decrypt } from '@conar/shared/utils/crypto-node'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'

export const resolve = orpc
  .use(authMiddleware)
  .input(type({ id: 'string.uuid' }))
  .handler(async ({ context, input }) => {
    const [connection, secret] = await Promise.all([
      db.query.connections.findFirst({
        columns: {
          connectionString: true,
        },
        where: {
          id: { eq: input.id },
          userId: { eq: context.user.id },
        },
      }),
      context.getUserSecret(),
    ])

    if (!connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    return {
      connectionString: decrypt({ encryptedText: connection.connectionString, secret }),
    }
  })
