import { MemoryRateLimiter } from '@orpc/ratelimit/memory'
import { ORPCError } from '@orpc/server'
import type { QueryExecutor } from '@tamery/connection/queries'
import * as clickhouse from '@tamery/connection/queries/dialects/clickhouse'
import * as mssql from '@tamery/connection/queries/dialects/mssql'
import * as mysql from '@tamery/connection/queries/dialects/mysql'
import * as oracle from '@tamery/connection/queries/dialects/oracle'
import * as pg from '@tamery/connection/queries/dialects/pg'
import * as sqlite from '@tamery/connection/queries/dialects/sqlite'
import { coldDialect, toQueryPayload } from '@tamery/connection/queries/kysely'
import { selectPage } from '@tamery/connection/queries/select-page'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { ShareRefresh } from '@tamery/shared/enums/share-refresh'
import { SHARE_REFRESH_MS } from '@tamery/shared/enums/share-refresh'
import type { ColumnTypes, FilterValueBinding } from '@tamery/shared/filters'
import {
  clickhouseFilterValues,
  sqliteFilterValues,
} from '@tamery/shared/filters'
import type { shareSort, ShareView } from '@tamery/shared/share'
import { LRUCache } from 'lru-cache'

const MAX_CACHED_PAGES = 2000
const DATABASE_READS_PER_MINUTE = 60

const executors: Record<Dialect, QueryExecutor> = {
  clickhouse: clickhouse.query,
  mssql: mssql.query,
  mysql: mysql.query,
  oracle: oracle.query,
  postgres: pg.query,
  sqlite: sqlite.query,
}

const filterBindings: Partial<
  Record<Dialect, (columns: ColumnTypes) => FilterValueBinding>
> = {
  clickhouse: clickhouseFilterValues,
  sqlite: sqliteFilterValues,
}

interface ShareRead {
  connectionString: string
  dialect: Dialect
  limit: number
  offset: number
  sort: typeof shareSort.infer
  view: ShareView
}

export const readShareRows = async ({
  connectionString,
  dialect,
  limit,
  offset,
  sort,
  view,
}: ShareRead) => {
  const compiled = selectPage(
    coldDialect(dialect),
    {
      filters: view.filters,
      limit,
      offset,
      orderBy: sort ? { [sort.column]: sort.direction } : view.orderBy,
      schema: view.schema,
      select: view.columns.map(({ id }) => id),
      table: view.table,
    },
    filterBindings[dialect]?.(view.columnTypes)
  ).compile()
  const { result } = await executors[dialect].execute({
    connectionString,
    ...toQueryPayload(dialect, compiled),
  })

  return { fetchedAt: new Date(), rows: result[0]?.rows ?? [] }
}

const databaseReads = new MemoryRateLimiter({
  maxRequests: DATABASE_READS_PER_MINUTE,
  window: 60 * 1000,
})

const pages = new LRUCache<
  string,
  Awaited<ReturnType<typeof readShareRows>>,
  { read: ShareRead; shareId: string }
>({
  fetchMethod: async (_key, _stale, { context: { read, shareId } }) => {
    const { success } = await databaseReads.limit(shareId)
    if (!success) {
      throw new ORPCError('TOO_MANY_REQUESTS')
    }
    return readShareRows(read)
  },
  max: MAX_CACHED_PAGES,
})

export const shareRows = {
  read: (
    share: { id: string; refresh: ShareRefresh; updatedAt: Date },
    read: ShareRead
  ) =>
    pages.forceFetch(
      JSON.stringify([
        share.id,
        share.updatedAt,
        read.limit,
        read.offset,
        read.sort,
      ]),
      {
        context: { read, shareId: share.id },
        ttl: SHARE_REFRESH_MS[share.refresh],
      }
    ),
}
