import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { enumValues } from '@conar/shared/utils/helpers'
import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import { pgEnum, pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'

export const connectionType = pgEnum('connection_type', enumValues(ConnectionType))

export const syncType = pgEnum('sync_type', enumValues(SyncType))

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

export const connectionsRelations = defineRelations({ connections, users }, r => ({
  connections: {
    user: r.one.users({
      from: r.connections.userId,
      to: r.users.id,
    }),
  },
}))
