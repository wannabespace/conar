import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { defineRelations } from 'drizzle-orm'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const connectionType = d.pgEnum('connection_type', ConnectionType)

export const syncType = d.pgEnum('sync_type', SyncType)

export const connections = d.snakeCase.table('connections', {
  ...baseTable,
  type: connectionType().notNull(),
  name: d.text().notNull(),
  connectionString: d.text().notNull(),
  label: d.text(),
  color: d.text(),
  isPasswordExists: d.boolean('password_exists').notNull(),
  isPasswordPopulated: d.boolean('password_populated').notNull(),
  syncType: syncType().notNull(),
})

export const connectionsResources = d.snakeCase.table('connections_resources', {
  ...baseTable,
  connectionId: d.uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  name: d.text(),
}, table => [
  d.unique().on(table.connectionId, table.name),
])

export const connectionsResourcesRelations = defineRelations(
  { connectionsResources, connections },
  r => ({
    connectionsResources: {
      connection: r.one.connections({
        from: r.connectionsResources.connectionId,
        to: r.connections.id,
      }),
    },
  }),
)
