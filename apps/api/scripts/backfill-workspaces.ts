// One-off ops script: console output is the intended interface, and the backfill
// runs sequentially on purpose (parallel would exhaust the DB connection pool).
/* eslint-disable no-console, no-await-in-loop */
import process from 'node:process'

import { db } from '@tamery/db'
import { users } from '@tamery/db/schema'

import { ensureDefaultWorkspace } from '~/lib/workspace'

/**
 * One-off pre-deploy backfill.
 *
 * Gives every existing user a default personal workspace and assigns their
 * connections to it. New users get this automatically on sign-in; this script
 * covers users that already exist when the workspace feature ships.
 *
 * Safe to run multiple times: `ensureDefaultWorkspace` returns the existing
 * workspace when the user already has one, so re-runs are no-ops.
 *
 * Run:  cd apps/api && bun run scripts/backfill-workspaces.ts
 */
async function main() {
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users)

  console.log(`Backfilling workspaces for ${allUsers.length} user(s)…`)

  let created = 0

  for (const user of allUsers) {
    try {
      await ensureDefaultWorkspace(user.id)
      created++
      console.log(`  ✓ ${user.email}`)
    } catch (error) {
      console.error(`  ✗ ${user.email}: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log(`Done. Processed ${created}/${allUsers.length} user(s).`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
