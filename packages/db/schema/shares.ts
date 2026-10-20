import { ShareRefresh } from '@tamery/shared/enums/share-refresh'
import type { ShareView } from '@tamery/shared/share'
import { defineRelationsPart } from 'drizzle-orm'
import * as d from 'drizzle-orm/pg-core'

import { baseTable } from '../base-table'
import { encryptedJson } from '../utils'
import { users } from './auth'
import { connectionsResources } from './connections'

export const shareRefresh = d.pgEnum('share_refresh', ShareRefresh)

export const shares = d.snakeCase.table('shares', {
  ...baseTable,
  connectionResourceId: d
    .uuid()
    .references(() => connectionsResources.id, { onDelete: 'cascade' })
    .notNull(),
  description: d.text(),
  expiresAt: d.timestamp({ withTimezone: true }),
  failingSince: d.timestamp({ withTimezone: true }),
  name: d.text().notNull(),
  passwordHash: d.text(),
  refresh: shareRefresh().notNull(),
  schema: d.text().notNull(),
  table: d.text().notNull(),
  userId: d
    .uuid()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  view: encryptedJson<
    Pick<ShareView, 'columnTypes' | 'columns' | 'filters' | 'orderBy'>
  >().notNull(),
})

export const sharesRelations = defineRelationsPart(
  { connectionsResources, shares },
  (r) => ({
    shares: {
      connectionResource: r.one.connectionsResources({
        from: r.shares.connectionResourceId,
        to: r.connectionsResources.id,
      }),
    },
  })
)
