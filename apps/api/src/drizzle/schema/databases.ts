import { DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { enumValues } from '@conar/shared/utils/helpers'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-arktype'
import { relations } from 'drizzle-orm'
import { pgEnum, pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'

export const databaseType = pgEnum('database_type', enumValues(DatabaseType))

export const syncType = pgEnum('sync_type', enumValues(SyncType))

export const databases = pgTable('databases', ({ uuid, text, boolean }) => ({
  ...baseTable,
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: databaseType().notNull(),
  name: text().notNull(),
  connectionString: encryptedText().notNull(),
  isPasswordExists: boolean('password_exists').notNull(),
  syncType: syncType().notNull(),
})).enableRLS()

export const databasesSelectSchema = createSelectSchema(databases)
export const databasesUpdateSchema = createUpdateSchema(databases)
export const databasesInsertSchema = createInsertSchema(databases)

export const databasesRelations = relations(databases, ({ one }) => ({
  user: one(users, {
    fields: [databases.userId],
    references: [users.id],
  }),
}))
