import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { pgEnum, pgTable, unique } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const connectionType = pgEnum('connection_type', ConnectionType)

export const syncType = pgEnum('sync_type', SyncType)

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
}))

export const connectionsResources = pgTable('connections_resources', ({ uuid, text }) => ({
  ...baseTable,
  connectionId: uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  name: text(),
}), t => [
  unique().on(t.connectionId, t.name),
])
