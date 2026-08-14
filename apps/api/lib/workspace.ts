import { db } from '@tamery/db'
import { connections, members, users, workspaces } from '@tamery/db/schema'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
    .slice(0, 32)

export const workspaceSlug = (name: string) => {
  const base = slugify(name) || 'workspace'

  return `${base}-${nanoid(8)}`
}

export const ensureDefaultWorkspace = (userId: string) =>
  db.transaction(async (tx) => {
    // Serialize concurrent calls for the same user so racing requests (e.g. parallel
    // session reads on sign-in) can't each create a duplicate default workspace. The
    // lock is released at transaction end; the membership re-check below happens under it.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`)

    const [existing] = await tx
      .select({ workspaceId: members.workspaceId })
      .from(members)
      .where(eq(members.userId, userId))
      .orderBy(asc(members.createdAt))
      .limit(1)

    if (existing) {
      return existing.workspaceId
    }

    const [user] = await tx
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'My'
    const workspaceName = `${displayName}'s workspace`

    const [workspace] = await tx
      .insert(workspaces)
      .values({
        metadata: JSON.stringify({ default: true }),
        name: workspaceName,
        slug: workspaceSlug(workspaceName),
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

    await tx
      .update(connections)
      .set({ workspaceId: workspace.id })
      .where(
        and(eq(connections.userId, userId), isNull(connections.workspaceId))
      )

    return workspace.id
  })
