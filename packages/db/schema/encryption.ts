import * as d from 'drizzle-orm/pg-core'

import { env } from '../env'
import { encryptedColumn } from '../utils'
import { users } from './auth'

// Per-user key that encrypts the user's cloud connection strings. Stored wrapped by USER_KEY_SECRET (env), so a database dump alone cannot read it. Cascades on user delete, crypto-shredding the user's connection strings. The table is owned by the tamery/main migrations against the shared database; this schema only mirrors it for type-safe queries.
export const userEncryptionKeys = d.snakeCase.table('user_encryption_keys', {
  userId: d
    .uuid()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  secret: encryptedColumn(env.USER_KEY_SECRET)().notNull(),
  createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})
