import { db } from '@conar/db'
import { decrypt } from '@conar/shared/utils/crypto-node'
import { encryptWithPublicKey } from '@conar/shared/utils/pair-keys'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'

export const resolve = orpc
  .use(authMiddleware)
  .input(type({ 'id': 'string.uuid.v7', 'publicKey': 'string', 'updatedAt?': 'Date' }))
  .handler(async ({ context, input }) => {
    const connection = await db.query.connections.findFirst({
      columns: {
        connectionString: true,
        updatedAt: true,
      },
      where: {
        id: { eq: input.id },
        userId: { eq: context.user.id },
      },
    })

    if (!connection) {
      return { status: 'not-found' as const }
    }

    if (input.updatedAt && input.updatedAt.getTime() >= connection.updatedAt.getTime()) {
      return { status: 'unchanged' as const }
    }

    const connectionString = decrypt({
      encryptedText: connection.connectionString,
      secret: await context.getUserSecret(),
    })

    return {
      status: 'modified' as const,
      connectionString: await encryptWithPublicKey({ text: connectionString, publicKey: input.publicKey }),
      updatedAt: connection.updatedAt,
    }
  })
