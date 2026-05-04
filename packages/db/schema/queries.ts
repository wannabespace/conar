import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/arktype'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'
import { connections, connectionsResources } from './connections'

export const queries = d.snakeCase.table('queries', {
  ...baseTable,
  userId: d.uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // TODO: remove it in the future versions, saving connectionId for backward compatibility
  connectionId: d.uuid().references(() => connections.id, { onDelete: 'cascade' }),
  connectionResourceId: d.uuid().references(() => connectionsResources.id, { onDelete: 'cascade' }),
  name: d.text().notNull(),
  query: encryptedText().notNull(),
})

export const queriesSelectSchema = createSelectSchema(queries)
export const queriesInsertSchema = createInsertSchema(queries)

export const queriesRelations = defineRelations(
  { queries, users, connections },
  r => ({
    queries: {
      user: r.one.users({
        from: r.queries.userId,
        to: r.users.id,
      }),
      connection: r.one.connections({
        from: r.queries.connectionId,
        to: r.connections.id,
      }),
    },
  }),
)
