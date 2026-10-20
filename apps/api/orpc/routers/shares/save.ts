import { db } from '@tamery/db'
import { shares, users } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { shareSaveInput } from '@tamery/shared/share'
import { FREE_SHARE_LIMIT } from '@tamery/shared/usage'
import { and, eq, ne, or } from 'drizzle-orm'

import { orpc, permissionsMiddleware } from '~/orpc'

export const save = orpc
  .use(permissionsMiddleware)
  .input(shareSaveInput)
  .errors({
    FORBIDDEN: {
      message: `The free plan shares up to ${FREE_SHARE_LIMIT} tables. Upgrade to Pro to share more.`,
    },
    NOT_FOUND: { message: 'Connection resource not found' },
    NOT_SYNCED: {
      message: 'Only a connection synced with Full can be shared.',
    },
  })
  .handler(async ({ context, errors, input }) => {
    const {
      connectionResourceId,
      description,
      expiresAt,
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

    // The user's row lock serializes their saves, or two at once both count under the free limit.
    return db.transaction(async (tx) => {
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, context.user.id))
        .for('update')

      const count = await tx.$count(
        shares,
        and(
          eq(shares.userId, context.user.id),
          or(
            ne(shares.connectionResourceId, connectionResourceId),
            ne(shares.schema, schema),
            ne(shares.table, table)
          )
        )
      )

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
        .onConflictDoUpdate({
          set: changes,
          target: [shares.connectionResourceId, shares.schema, shares.table],
        })
        .returning({ id: shares.id })
      return row
    })
  })
