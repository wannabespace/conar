import { db } from '@conar/db'
import { connectionsResources, connectionsResourcesInsertSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(connectionsResourcesInsertSchema)
  .handler(async ({ context, input }) => {
    const connection = await db.query.connections.findFirst({
      where: {
        userId: {
          eq: context.user.id,
        },
        id: {
          eq: input.connectionId,
        },
      },
    })

    if (!connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    await db.insert(connectionsResources).values(input).onConflictDoUpdate({
      target: [connectionsResources.connectionId, connectionsResources.name],
      set: input,
    })
  })
