import { db } from '@conar/db'
import { connectionsResources, connectionsResourcesUpdateSchema } from '@conar/db/schema'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { generateTxId } from '~/lib/electric'
import { authMiddleware, orpc } from '~/orpc'

export const update = orpc
  .use(authMiddleware)
  .input(type.and(
    connectionsResourcesUpdateSchema.omit('createdAt', 'updatedAt', 'id', 'connectionId'),
    connectionsResourcesUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input

    const found = await db.query.connectionsResources.findFirst({
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

    if (!found) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection resource not found' })
    }

    return db.transaction(async (tx) => {
      await tx
        .update(connectionsResources)
        .set(changes)
        .where(eq(connectionsResources.id, id))

      return { txid: await generateTxId(tx) }
    })
  })
