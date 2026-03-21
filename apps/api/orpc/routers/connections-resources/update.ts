import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { db } from '~/drizzle'
import { connectionsResources, connectionsResourcesUpdateSchema } from '~/drizzle/schema'
import { authMiddleware, orpc } from '~/orpc'

export const update = orpc
  .use(authMiddleware)
  .input(type.and(
    connectionsResourcesUpdateSchema.omit('createdAt', 'updatedAt', 'id', 'connectionId'),
    connectionsResourcesUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input

    const resource = await db.query.connectionsResources.findFirst({
      columns: {
        id: true,
      },
      where: {
        id: {
          eq: input.id,
        },
        connection: {
          userId: {
            eq: context.user.id,
          },
        },
      },
    })

    if (!resource) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection resource not found' })
    }

    await db
      .update(connectionsResources)
      .set(changes)
      .where(eq(connectionsResources.id, id))
  })
