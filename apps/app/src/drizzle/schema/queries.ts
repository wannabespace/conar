import { defineRelations } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { connectionsResources } from './connections'

export const queries = pgTable('queries', ({ uuid, text }) => ({
  ...baseTable,
  connectionResourceId: uuid().references(() => connectionsResources.id, { onDelete: 'cascade' }).notNull(),
  name: text().notNull(),
  query: text().notNull(),
}))

export const queriesRelations = defineRelations({ queries, connectionsResources }, r => ({
  queries: {
    connectionResource: r.one.connectionsResources({
      from: r.queries.connectionResourceId,
      to: r.connectionsResources.id,
    }),
  },
}))
