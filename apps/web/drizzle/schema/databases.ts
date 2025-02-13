import type { DatabaseCredentials } from '@connnect/shared/types/database'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { enumValues } from '@connnect/shared/utils'
import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedJsonb } from '../utils'
import { users } from './auth'

export const databaseType = pgEnum('database_type', enumValues(DatabaseType))

export const databases = pgTable('databases', {
  ...baseTable,
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: databaseType().notNull(),
  name: text(),
  credentials: encryptedJsonb<DatabaseCredentials>().notNull(),
}).enableRLS()

export const databasesRelations = relations(databases, ({ one }) => ({
  user: one(users, {
    fields: [databases.userId],
    references: [users.id],
  }),
}))
