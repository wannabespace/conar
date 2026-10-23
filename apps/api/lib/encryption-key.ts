import { db } from '@conar/db'
import { userEncryptionKeys } from '@conar/db/schema'
import { infisical } from '@conar/infisical'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'

export const userEncryptionKey = {
  async create(userId: string) {
    const secret = nanoid()

    await db.insert(userEncryptionKeys).values({ secret, userId })

    return secret
  },
  async get(userId: string) {
    const [row] = await db
      .select({ secret: userEncryptionKeys.secret })
      .from(userEncryptionKeys)
      .where(eq(userEncryptionKeys.userId, userId))
      .limit(1)

    if (row) {
      return row.secret
    }

    // Transitional: users created before the migration keep their key in Infisical. Backfill on first read; removed once every row is migrated.
    const secret = await infisical.secrets.get({
      path: ['users', userId],
      name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
    })

    await db.insert(userEncryptionKeys).values({ secret, userId }).onConflictDoNothing()

    return secret
  },
}
