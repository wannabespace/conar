import process from 'node:process'

import { db } from '@tamery/db'
import { members, sessions, users, workspaces } from '@tamery/db/schema'
import { and, eq, exists, gt, inArray, not } from 'drizzle-orm'

import { auth } from '~/lib/auth'

const shouldDelete = process.argv.includes('--delete')

const staleGuests = await db
  .select({ createdAt: users.createdAt, id: users.id })
  .from(users)
  .where(
    and(
      eq(users.isAnonymous, true),
      not(
        exists(
          db
            .select()
            .from(sessions)
            .where(
              and(
                eq(sessions.userId, users.id),
                gt(sessions.expiresAt, new Date())
              )
            )
        )
      )
    )
  )

console.table(staleGuests)

if (!shouldDelete) {
  console.log(
    `${staleGuests.length} guests without a live session. Re-run with --delete to delete them.`
  )
  process.exit(0)
}

const guestIds = staleGuests.map((guest) => guest.id)

// Workspaces have no user FK, so they outlive the user unless deleted first.
await db
  .delete(workspaces)
  .where(
    inArray(
      workspaces.id,
      db
        .select({ id: members.workspaceId })
        .from(members)
        .where(inArray(members.userId, guestIds))
    )
  )

const context = await auth.$context

for (const id of guestIds) {
  // oxlint-disable-next-line eslint/no-await-in-loop -- one at a time: each delete also calls Infisical to drop the user's secret
  await context.internalAdapter.deleteUser(id)
}

console.log(`Deleted ${staleGuests.length} guests.`)
process.exit(0)
