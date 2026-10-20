import { db } from '@tamery/db'
import { shares, users } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { shareSaveInput } from '@tamery/shared/share'
import { FREE_SHARE_LIMIT } from '@tamery/shared/usage'
import { and, eq } from 'drizzle-orm'

import { orpc, permissionsMiddleware } from '~/orpc'

export const save = orpc
  .use(permissionsMiddleware)
  .input(shareSaveInput)
  .errors({
    FORBIDDEN: {
      message: `The free plan keeps up to ${FREE_SHARE_LIMIT} shared links. Upgrade to Pro to share more.`,
    },
    NOT_FOUND: { message: 'This share or its connection no longer exists.' },
    NOT_SYNCED: {
      message: 'Only a connection synced with Full can be shared.',
    },
  })
  .handler(async ({ context, errors, input }) => {
    const {
      connectionResourceId,
      description,
      expiresAt,
      id,
      name,
      password,
      refresh,
      schema,
      table,
      ...view
    } = input
    const resource = await db.query.connectionsResources.findFirst({
      columns: { id: true },
      where: {
        connection: { userId: { eq: context.user.id } },
        id: { eq: connectionResourceId },
      },
      with: { connection: { columns: { syncType: true } } },
    })

    if (!resource?.connection) {
      throw errors.NOT_FOUND()
    }
    if (resource.connection.syncType !== SyncType.Cloud) {
      throw errors.NOT_SYNCED()
    }

    const changes = {
      description,
      expiresAt,
      failingSince: null,
      name,
      refresh,
      view,
      ...(password !== undefined && {
        passwordHash: password && (await Bun.password.hash(password)),
      }),
    }

    if (id) {
      const [row] = await db
        .update(shares)
        .set(changes)
        .where(and(eq(shares.id, id), eq(shares.userId, context.user.id)))
        .returning({ id: shares.id })
      if (!row) {
        throw errors.NOT_FOUND()
      }
      return row
    }

    // The user's row lock serializes their saves, or two at once both count under the free limit.
    return db.transaction(async (tx) => {
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, context.user.id))
        .for('update')

      const count = await tx.$count(shares, eq(shares.userId, context.user.id))

      if (!context.permissions.check('share.create', { count })) {
        throw errors.FORBIDDEN()
      }

      const [row] = await tx
        .insert(shares)
        .values({
          ...changes,
          connectionResourceId,
          schema,
          table,
          userId: context.user.id,
        })
        .returning({ id: shares.id })
      return row
    })
  })
