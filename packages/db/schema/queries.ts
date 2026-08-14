import { defineRelationsPart } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/arktype'
import * as d from 'drizzle-orm/pg-core'

import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'
import { connectionsResources } from './connections'

export const queries = d.snakeCase.table('queries', {
  ...baseTable,
  connectionResourceId: d
    .uuid()
    .references(() => connectionsResources.id, { onDelete: 'cascade' })
    .notNull(),
  name: d.text().notNull(),
  query: encryptedText().notNull(),
  userId: d
    .uuid()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
})

export const queriesSelectSchema = createSelectSchema(queries)
export const queriesInsertSchema = createInsertSchema(queries)

export const queriesRelations = defineRelationsPart(
  { connectionsResources, queries, users },
  (r) => ({
    queries: {
      connectionResource: r.one.connectionsResources({
        from: r.queries.connectionResourceId,
        to: r.connectionsResources.id,
      }),
      user: r.one.users({
        from: r.queries.userId,
        to: r.users.id,
      }),
    },
  })
)
