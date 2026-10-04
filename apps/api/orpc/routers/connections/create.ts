import { db } from '@tamery/db'
import { connections, connectionsInsertSchema } from '@tamery/db/schema'
import { GUEST_CONNECTIONS_MESSAGE } from '@tamery/shared/constants'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { encryptConnectionString } from '~/lib/connection-string'
import { ensureDefaultWorkspace, memberWorkspaceIds } from '~/lib/workspace'
import { orpc, permissionsMiddleware } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(permissionsMiddleware)
  .input(
    connectionsInsertSchema
      .omit('userId', 'workspaceId')
      .and(type({ id: 'string.uuid.v7', 'workspaceId?': 'string | null' }))
  )
  .errors({
    FORBIDDEN: { message: GUEST_CONNECTIONS_MESSAGE },
  })
  .handler(async ({ context, errors, input }) => {
    // Before the limit check: an outbox replay of a create whose response was
    // lost would count its own row and fail with FORBIDDEN.
    const alreadyCreated = await db.$count(
      connections,
      and(eq(connections.id, input.id), eq(connections.userId, context.user.id))
    )

    if (alreadyCreated > 0) {
      return
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

    const count = await db.$count(
      connections,
      eq(connections.userId, context.user.id)
    )

    if (!context.permissions.check('connection.create', { count })) {
      throw errors.FORBIDDEN()
    }

    const [inserted] = await db
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
      .onConflictDoNothing()
      .returning()

    if (inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: inserted,
      })
    }
  })
