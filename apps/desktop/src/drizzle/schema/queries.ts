import { defineRelations } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { connections } from './connections'

export const queries = pgTable('queries', ({ uuid, text }) => ({
  ...baseTable,
  connectionId: uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  name: text().notNull(),
  query: text().notNull(),
}))

export const queriesRelations = defineRelations({ queries, connections }, r => ({
  queries: {
    connection: r.one.connections({
      from: r.queries.connectionId,
      to: r.connections.id,
    }),
  },
}))
