import { db } from '@tamery/db'
import { members, workspaces, workspacesSelectSchema } from '@tamery/db/schema'
import { type } from 'arktype'
import { addSeconds } from 'date-fns'
import type { SQL } from 'drizzle-orm'
import { and, eq, gte, inArray, notInArray, or } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'
import { createSyncOutputSchema, syncDiff } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(workspacesSelectSchema).array()

const memberWorkspaces = (userId: string, filter?: SQL) =>
  db
    .select({
      createdAt: workspaces.createdAt,
      id: workspaces.id,
      logo: workspaces.logo,
      metadata: workspaces.metadata,
      name: workspaces.name,
      slug: workspaces.slug,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaces)
    .innerJoin(members, eq(members.workspaceId, workspaces.id))
    .where(and(eq(members.userId, userId), filter))

export const sync = orpc
  .use(authMiddleware)
  .input(
    type({
      id: 'string.uuid.v7',
      updatedAt: 'Date',
    }).array()
  )
  .output(output)
  .handler(async ({ input, context }) => {
    const userId = context.user.id
    const { updatedItems, newItems, missingIds } = await syncDiff({
      input,
      queries: {
        existing: (includeIds) =>
          db
            .select({ id: workspaces.id })
            .from(workspaces)
            .innerJoin(members, eq(members.workspaceId, workspaces.id))
            .where(
              and(
                eq(members.userId, userId),
                inArray(workspaces.id, includeIds)
              )
            )
            .then((rows) => rows.map((row) => row.id)),
        new: (excludeIds) =>
          memberWorkspaces(userId, notInArray(workspaces.id, excludeIds)),
        updated: (items) =>
          memberWorkspaces(
            userId,
            or(
              ...items.map((item) =>
                and(
                  eq(workspaces.id, item.id),
                  gte(workspaces.updatedAt, addSeconds(item.updatedAt, 1))
                )
              )
            )
          ),
      },
    })
    const syncResult: typeof output.infer = []

    for (const item of updatedItems) {
      syncResult.push({ type: 'update', value: item })
    }

    for (const item of newItems) {
      syncResult.push({ type: 'insert', value: item })
    }

    for (const item of missingIds) {
      syncResult.push({ key: item, type: 'delete' })
    }

    return syncResult
  })
