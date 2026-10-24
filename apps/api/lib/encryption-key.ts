import { db } from '@conar/db'
import { userEncryptionKeys } from '@conar/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

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

    if (!row) {
      throw new Error(`No encryption key for user ${userId}`)
    }

    return row.secret
  },
}
