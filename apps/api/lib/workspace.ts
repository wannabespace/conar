import { db } from '@tamery/db'
import { connections, members, users, workspaces } from '@tamery/db/schema'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function workspaceSlug(name: string) {
  const base = slugify(name) || 'workspace'

  return `${base}-${nanoid(8)}`
}

export async function ensureDefaultWorkspace(userId: string) {
  return db.transaction(async tx => {
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
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'My'
    const workspaceName = `${displayName}'s workspace`

    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug: workspaceSlug(workspaceName),
        metadata: JSON.stringify({ default: true }),
      })
      .returning({ id: workspaces.id })

    await tx.insert(members).values({
      workspaceId: workspace!.id,
      userId,
      role: 'owner',
    })

    await tx
      .update(connections)
      .set({ workspaceId: workspace!.id })
      .where(and(eq(connections.userId, userId), isNull(connections.workspaceId)))

    return workspace!.id
  })
}
