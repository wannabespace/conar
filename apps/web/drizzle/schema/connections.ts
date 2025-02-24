import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { enumValues } from '@connnect/shared/utils'
import { relations } from 'drizzle-orm'
import { boolean, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'

export const connectionType = pgEnum('connection_type', enumValues(ConnectionType))

export const connections = pgTable('connections', {
  ...baseTable,
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: connectionType().notNull(),
  name: text().notNull(),
  connectionString: encryptedText('connection_string').notNull(),
  isPasswordExists: boolean('password_exists').notNull(),
}).enableRLS()

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
}))
