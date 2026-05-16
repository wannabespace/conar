import { db } from '@conar/db'
import { users } from '@conar/db/schema'
import { infisical } from '@conar/infisical'
import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'
import { orpc } from '~/orpc'

export const migrateSecrets = orpc.handler(async ({ context }) => {
  const allUsers = await db.select({ id: users.id, secret: users.secret }).from(users)

  context.addLogData({ allUsers: allUsers.length })

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
        context.addLogData({ error: { message: `Failed to migrate user ${user.id}:`, cause: err } })
        failed++
      }
    }

    if ((migrated + skipped + failed) % 50 === 0) {
      context.addLogData({ progress: { migrated, skipped, failed } })
    }
  }

  context.addLogData({ progress: { migrated, skipped, failed } })
})
