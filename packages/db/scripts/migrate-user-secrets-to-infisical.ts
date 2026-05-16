import process from 'node:process'
import { infisical } from '@conar/infisical'
import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '../../../apps/api/constants'
import { db } from '../index'
import { users } from '../schema/auth'

async function main() {
  const allUsers = await db.select({ id: users.id, secret: users.secret }).from(users)

  console.log(`Found ${allUsers.length} users to migrate`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const user of allUsers) {
    const location = { path: ['users', user.id], name: INFISICAL_USER_ENCRYPTION_SECRET_NAME }

    try {
      await infisical.secrets.get(location)
      skipped++
    }
    catch {
      try {
        await infisical.secrets.set({ ...location, value: user.secret })
        migrated++
      }
      catch (err) {
        console.error(`Failed to migrate user ${user.id}:`, err)
        failed++
      }
    }

    if ((migrated + skipped + failed) % 50 === 0) {
      console.log(`Progress: ${migrated + skipped + failed}/${allUsers.length} (migrated: ${migrated}, skipped: ${skipped}, failed: ${failed})`)
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped (already in Infisical): ${skipped}, Failed: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
