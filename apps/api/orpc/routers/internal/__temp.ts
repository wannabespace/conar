import { db } from '@conar/db'
import { users } from '@conar/db/schema'
import { infisical } from '@conar/infisical'
import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'
import { orpc } from '~/orpc'

export const migrateSecrets = orpc
  .use(async ({ context, next }) => {
    context.setHeader('Transfer-Encoding', 'chunked')
    context.setHeader('Connection', 'keep-alive')
    return next()
  })
  .handler(async function* ({ context }) {
    const allUsers = await db.select({ id: users.id, secret: users.secret }).from(users)

    context.addLogData({ allUsers: allUsers.length })
    yield { type: 'start' as const, total: allUsers.length }

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

      const processed = migrated + skipped + failed
      if (processed % 50 === 0) {
        context.addLogData({ progress: { migrated, skipped, failed } })
        yield { type: 'progress' as const, migrated, skipped, failed, total: allUsers.length }
      }
    }

    context.addLogData({ progress: { migrated, skipped, failed } })
    yield { type: 'done' as const, migrated, skipped, failed, total: allUsers.length }
  })
