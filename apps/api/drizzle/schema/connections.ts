import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'

export const connectionType = d.pgEnum('connection_type', ConnectionType)

export const syncType = d.pgEnum('sync_type', SyncType)

export const connections = d.snakeCase.table('connections', {
  ...baseTable,
  userId: d.uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: connectionType().notNull(),
  name: d.text().notNull(),
  connectionString: encryptedText().notNull(),
  label: d.text(),
  color: d.text(),
  isPasswordExists: d.boolean('password_exists').notNull(),
  syncType: syncType().notNull(),
})

export const connectionsSelectSchema = createSelectSchema(connections)
export const connectionsUpdateSchema = createUpdateSchema(connections)
export const connectionsInsertSchema = createInsertSchema(connections)

export const connectionsResources = d.snakeCase.table('connections_resources', {
  ...baseTable,
  connectionId: d.uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  name: d.text(),
}, t => [
  d.unique().on(t.connectionId, t.name),
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
