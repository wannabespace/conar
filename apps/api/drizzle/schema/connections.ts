import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import { pgEnum, pgTable, unique } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'

export const connectionType = pgEnum('connection_type', ConnectionType)

export const syncType = pgEnum('sync_type', SyncType)

export const connections = pgTable('connections', ({ uuid, text, boolean }) => ({
  ...baseTable,
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: connectionType().notNull(),
  name: text().notNull(),
  connectionString: encryptedText().notNull(),
  label: text(),
  color: text(),
  isPasswordExists: boolean('password_exists').notNull(),
  syncType: syncType().notNull(),
}))

export const connectionsSelectSchema = createSelectSchema(connections)
export const connectionsUpdateSchema = createUpdateSchema(connections)
export const connectionsInsertSchema = createInsertSchema(connections)

export const connectionsResources = pgTable('connections_resources', ({ uuid, text }) => ({
  ...baseTable,
  connectionId: uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  name: text(),
}), t => [
  unique().on(t.connectionId, t.name),
])

export const connectionsResourcesSelectSchema = createSelectSchema(connectionsResources)
export const connectionsResourcesUpdateSchema = createUpdateSchema(connectionsResources)
export const connectionsResourcesInsertSchema = createInsertSchema(connectionsResources)

export const connectionsRelations = defineRelations({ connections, connectionsResources, users }, r => ({
  connections: {
    user: r.one.users({
      from: r.connections.userId,
      to: r.users.id,
    }),
    resources: r.many.connectionsResources({
      from: r.connections.id,
      to: r.connectionsResources.connectionId,
    }),
  },
  connectionsResources: {
    connection: r.one.connections({
      from: r.connectionsResources.connectionId,
      to: r.connections.id,
    }),
  },
}))
