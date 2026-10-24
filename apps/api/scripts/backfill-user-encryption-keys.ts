/* oxlint-disable no-console */
import process from 'node:process'

import { db } from '@tamery/db'
import { userEncryptionKeys, users } from '@tamery/db/schema'
import { notInArray } from 'drizzle-orm'

import { userEncryptionKey } from '~/lib/encryption-key'

const existing = await db
  .select({ userId: userEncryptionKeys.userId })
  .from(userEncryptionKeys)

const pending = await db
  .select({ id: users.id })
  .from(users)
  .where(
    existing.length > 0
      ? notInArray(
          users.id,
          existing.map((row) => row.userId)
        )
      : undefined
  )

console.log(
  `${existing.length} users already migrated, ${pending.length} to migrate`
)

let migrated = 0
const missing: string[] = []

for (const { id } of pending) {
  try {
    // get() reads the Infisical secret and backfills the row for a pre-migration user.
    // oxlint-disable-next-line no-await-in-loop -- one Infisical read + insert per user
    await userEncryptionKey.get(id)
    migrated += 1
  } catch {
    missing.push(id)
  }
}

console.log(`Migrated ${migrated} users`)

if (missing.length > 0) {
  console.error(
    `No Infisical secret for ${missing.length} users (left unmigrated): ${missing.join(', ')}`
  )
}

process.exit(missing.length > 0 ? 1 : 0)
