import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { type } from 'arktype'
import { and, defineRelationsPart, inArray, isNotNull } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import * as d from 'drizzle-orm/pg-core'

import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users, workspaces } from './auth'

export const connectionType = d.pgEnum('connection_type', ConnectionType)

const TAMERY_CLOUD_WITHOUT_PASSWORD = 'cloud_without_secrets'

// Tamery renamed the enum value; installed Conar builds still send and compare the old one.
const syncType = d.customType<{ data: SyncType; driverData: string }>({
  dataType() {
    return 'sync_type'
  },
  toDriver(value) {
    return value === SyncType.CloudWithoutPassword ? TAMERY_CLOUD_WITHOUT_PASSWORD : value
  },
  fromDriver(value) {
    return value === TAMERY_CLOUD_WITHOUT_PASSWORD
      ? SyncType.CloudWithoutPassword
      : (value as SyncType)
  },
})

export const connections = d.snakeCase.table('connections', {
  ...baseTable,
  userId: d
    .uuid()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: connectionType().notNull(),
  name: d.text().notNull(),
  connectionString: encryptedText().notNull(),
  label: d.text(),
  color: d.text(),
  isPasswordExists: d.boolean('password_exists').notNull(),
  syncType: syncType().notNull(),
  workspaceId: d
    .uuid()
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
})

export const connectionsVisibleInConar = and(
  inArray(connections.type, Object.values(ConnectionType)),
  inArray(connections.syncType, Object.values(SyncType)),
  isNotNull(connections.connectionString),
)

const syncTypeSchema = () => type.valueOf(SyncType)

export const connectionsSelectSchema = createSelectSchema(connections, { syncType: syncTypeSchema })
export const connectionsUpdateSchema = createUpdateSchema(connections, { syncType: syncTypeSchema })
export const connectionsInsertSchema = createInsertSchema(connections, { syncType: syncTypeSchema })

export const connectionsResources = d.snakeCase.table(
  'connections_resources',
  {
    ...baseTable,
    connectionId: d
      .uuid()
      .references(() => connections.id, { onDelete: 'cascade' })
      .notNull(),
    name: d.text(),
  },
  t => [d.unique().on(t.connectionId, t.name)],
)

export const connectionsResourcesSelectSchema = createSelectSchema(connectionsResources)
export const connectionsResourcesUpdateSchema = createUpdateSchema(connectionsResources)
export const connectionsResourcesInsertSchema = createInsertSchema(connectionsResources)

export const connectionsRelations = defineRelationsPart(
  { connections, connectionsResources, users },
  r => ({
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
  }),
)
