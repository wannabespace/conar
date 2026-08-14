// One-off ops script: console output is the intended interface, and the backfill
// runs sequentially on purpose (parallel would exhaust the DB connection pool).
/* eslint-disable no-console, no-await-in-loop */
import process from 'node:process'

import { db } from '@tamery/db'
import { users } from '@tamery/db/schema'

import { ensureDefaultWorkspace } from '~/lib/workspace'

const main = async () => {
  const allUsers = await db
    .select({ email: users.email, id: users.id })
    .from(users)

  console.log(`Backfilling workspaces for ${allUsers.length} user(s)…`)

  let created = 0

  for (const user of allUsers) {
    try {
      await ensureDefaultWorkspace(user.id)
      created += 1
      console.log(`  ✓ ${user.email}`)
    } catch (error) {
      console.error(
        `  ✗ ${user.email}: ${error instanceof Error ? error.message : error}`
      )
    }
  }

  console.log(`Done. Processed ${created}/${allUsers.length} user(s).`)
}

const run = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

void run()
