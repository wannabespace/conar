import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/arktype'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'
import { connections } from './connections'

export const queries = pgTable('queries', ({ uuid, text }) => ({
  ...baseTable,
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectionId: uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  name: text().notNull(),
  query: encryptedText().notNull(),
}))

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
