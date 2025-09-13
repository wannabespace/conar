import { DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { enumValues } from '@conar/shared/utils/helpers'
import { pgEnum, pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const databaseType = pgEnum('database_type', enumValues(DatabaseType))

export const syncType = pgEnum('sync_type', enumValues(SyncType))

export const databases = pgTable('databases', ({ text, boolean }) => ({
  ...baseTable,
  type: databaseType().notNull(),
  name: text().notNull(),
  connectionString: text().notNull(),
  isPasswordExists: boolean('password_exists').notNull(),
  isPasswordPopulated: boolean('password_populated').notNull(),
  syncType: syncType().notNull(),
}))
