import { defineRelations } from 'drizzle-orm'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { connectionsResources } from './connections'

export const queries = d.snakeCase.table('queries', {
  ...baseTable,
  connectionResourceId: d.uuid().references(() => connectionsResources.id, { onDelete: 'cascade' }).notNull(),
  name: d.text().notNull(),
  query: d.text().notNull(),
})

export const queriesRelations = defineRelations({ queries, connectionsResources }, r => ({
  queries: {
    connectionResource: r.one.connectionsResources({
      from: r.queries.connectionResourceId,
      to: r.connectionsResources.id,
    }),
  },
}))
