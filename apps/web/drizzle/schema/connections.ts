import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { enumValues } from '@connnect/shared/utils/helpers'
import { relations } from 'drizzle-orm'
import { pgEnum, pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'

export const connectionType = pgEnum('connection_type', enumValues(ConnectionType))

export const connections = pgTable('connections', t => ({
  ...baseTable,
  userId: t.uuid().references(() => users.id, { onDelete: 'cascade' }),
  type: connectionType().notNull(),
  name: t.text().notNull(),
  connectionString: encryptedText().notNull(),
  isPasswordExists: t.boolean('password_exists').notNull(),
})).enableRLS()

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
}))
