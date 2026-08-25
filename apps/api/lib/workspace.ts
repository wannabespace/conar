import { db } from '@tamery/db'
import { members, workspaces } from '@tamery/db/schema'
import { slugify } from '@tamery/shared/utils/slugify'
import {
  isDefaultWorkspaceMetadata,
  serializeWorkspaceMetadata,
} from '@tamery/shared/workspace'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const DEFAULT_WORKSPACE_NAME = 'Personal'

export const workspaceSlug = (name: string) => {
  const base = slugify(name) || 'workspace'

  return `${base}-${nanoid(8)}`
}

const userDefaultWorkspaceId = async (
  userId: string,
  executor: Pick<typeof db, 'select'> = db
) => {
  const rows = await executor
    .select({ id: workspaces.id, metadata: workspaces.metadata })
    .from(members)
    .innerJoin(workspaces, eq(workspaces.id, members.workspaceId))
    .where(eq(members.userId, userId))
    .orderBy(asc(members.createdAt))

  return (
    rows.find((row) => isDefaultWorkspaceMetadata(row.metadata))?.id ?? null
  )
}

export const ensureDefaultWorkspace = async (userId: string) => {
  const existingId = await userDefaultWorkspaceId(userId)

  if (existingId) {
    return existingId
  }

  return db.transaction(async (tx) => {
    // Serialize concurrent calls for the same user so racing requests (e.g. parallel
    // session reads on sign-in) can't each create a duplicate default workspace. The
    // lock is released at transaction end; the re-check below happens under it.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`)

    // The lock is only released when its holder commits, and this read runs
    // under READ COMMITTED, so it already sees a competitor's created workspace.
    const lockedId = await userDefaultWorkspaceId(userId, tx)

    if (lockedId) {
      return lockedId
    }

    const [workspace] = await tx
      .insert(workspaces)
      .values({
        metadata: serializeWorkspaceMetadata({ default: true }),
        name: DEFAULT_WORKSPACE_NAME,
        slug: workspaceSlug(DEFAULT_WORKSPACE_NAME),
      })
      .returning({ id: workspaces.id })

    if (!workspace) {
      throw new Error('Failed to create default workspace')
    }

    await tx.insert(members).values({
      role: 'owner',
      userId,
      workspaceId: workspace.id,
    })

    return workspace.id
  })
}

export const memberWorkspaceIds = async (
  userId: string,
  workspaceIds: string[]
) => {
  if (workspaceIds.length === 0) {
    return new Set<string>()
  }

  const rows = await db
    .select({ workspaceId: members.workspaceId })
    .from(members)
    .where(
      and(
        eq(members.userId, userId),
        inArray(members.workspaceId, workspaceIds)
      )
    )

  return new Set(rows.map((row) => row.workspaceId))
}
