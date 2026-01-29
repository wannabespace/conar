import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { enumValues } from '@conar/shared/utils/helpers'
import { pgEnum, pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const connectionType = pgEnum('connection_type', enumValues(ConnectionType))

export const syncType = pgEnum('sync_type', enumValues(SyncType))

export const connections = pgTable('connections', ({ text, boolean }) => ({
  ...baseTable,
  type: connectionType().notNull(),
  name: text().notNull(),
  connectionString: text().notNull(),
  label: text(),
  color: text(),
  isPasswordExists: boolean('password_exists').notNull(),
  isPasswordPopulated: boolean('password_populated').notNull(),
  syncType: syncType().notNull(),
  version: text(),
}))
