import { db } from '@tamery/db'
import { connections, connectionsInsertSchema } from '@tamery/db/schema'
import {
  GUEST_CONNECTIONS_MESSAGE,
  GUEST_SYNC_MESSAGE,
} from '@tamery/shared/constants'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { type } from 'arktype'
import { eq, sql } from 'drizzle-orm'

import { encryptConnectionString } from '~/lib/connection-string'
import { ensureDefaultWorkspace, memberWorkspaceIds } from '~/lib/workspace'
import { orpc, permissionsMiddleware } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(permissionsMiddleware)
  .input(
    connectionsInsertSchema
      .omit('userId', 'workspaceId')
      .and(type({ 'workspaceId?': 'string | null' }))
  )
  .errors({
    FORBIDDEN: { message: GUEST_CONNECTIONS_MESSAGE },
  })
  .handler(async ({ context, errors, input }) => {
    if (
      !context.permissions.check('connection.syncString') &&
      input.syncType !== SyncType.CloudWithoutConnectionString
    ) {
      throw errors.FORBIDDEN({ message: GUEST_SYNC_MESSAGE })
    }

    const allowedWorkspaceIds = await memberWorkspaceIds(
      context.user.id,
      typeof input.workspaceId === 'string' ? [input.workspaceId] : []
    )
    const workspaceId =
      input.workspaceId && allowedWorkspaceIds.has(input.workspaceId)
        ? input.workspaceId
        : await ensureDefaultWorkspace(context.user.id)
    const workspaceSecret = await context.getWorkspaceSecret(workspaceId)

    const [inserted] = await db.transaction(async (tx) => {
      // The lock serializes a user's concurrent creates and exchange's adoption so the count can't race.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${context.user.id}))`
      )

      const count = await tx.$count(
        connections,
        eq(connections.userId, context.user.id)
      )

      if (!context.permissions.check('connection.create', { count })) {
        throw errors.FORBIDDEN()
      }

      return tx
        .insert(connections)
        .values({
          ...input,
          connectionString: encryptConnectionString({
            connectionString: input.connectionString,
            secret: workspaceSecret,
            syncType: input.syncType,
          }),
          userId: context.user.id,
          workspaceId,
        })
        .returning()
    })

    if (!inserted) {
      throw new Error('Failed to create connection')
    }

    publisher.publish(context.user.id, {
      type: 'insert',
      value: inserted,
    })
  })
