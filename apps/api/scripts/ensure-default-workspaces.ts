import process from 'node:process'

import { db } from '@tamery/db'
import { members, users, workspaces } from '@tamery/db/schema'
import { and, eq, exists, not, sql } from 'drizzle-orm'

import { ensureDefaultWorkspace } from '~/lib/workspace'

const usersWithoutWorkspace = await db
  .select({ id: users.id })
  .from(users)
  .where(
    not(
      exists(
        db
          .select()
          .from(members)
          .innerJoin(workspaces, eq(workspaces.id, members.workspaceId))
          .where(
            and(
              eq(members.userId, users.id),
              sql`${workspaces.metadata}::jsonb ->> 'default' = 'true'`
            )
          )
      )
    )
  )

await Promise.all(
  usersWithoutWorkspace.map((user) => ensureDefaultWorkspace(user.id))
)

console.log(
  `Created a default workspace for ${usersWithoutWorkspace.length} users.`
)
process.exit(0)
