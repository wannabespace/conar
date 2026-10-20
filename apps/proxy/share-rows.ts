import type { QueryExecutor } from '@tamery/connection/queries'
import * as clickhouse from '@tamery/connection/queries/dialects/clickhouse'
import { prepareQuery } from '@tamery/connection/queries/dialects/clickhouse/prepare-query'
import * as mssql from '@tamery/connection/queries/dialects/mssql'
import * as mysql from '@tamery/connection/queries/dialects/mysql'
import * as pg from '@tamery/connection/queries/dialects/pg'
import * as sqlite from '@tamery/connection/queries/dialects/sqlite'
import { coldDialects } from '@tamery/connection/queries/kysely'
import { Dialect } from '@tamery/shared/enums/connection-type'
import {
  SHARE_REFRESH_MS,
  ShareRefresh,
} from '@tamery/shared/enums/share-refresh'
import type { ColumnTypes, FilterValueBinding } from '@tamery/shared/filters'
import {
  clickhouseFilterValues,
  sqliteFilterValues,
  toKyselyFilter,
} from '@tamery/shared/filters'
import type { shareSort, ShareView } from '@tamery/shared/share'
import { clearMemoizeCache, memoize } from 'memoza'

const executors: Record<Dialect, QueryExecutor> = {
  clickhouse: clickhouse.query,
  mssql: mssql.query,
  mysql: mysql.query,
  postgres: pg.query,
  sqlite: sqlite.query,
}

const filterBindings: Partial<
  Record<Dialect, (columns: ColumnTypes) => FilterValueBinding>
> = {
  clickhouse: clickhouseFilterValues,
  sqlite: sqliteFilterValues,
}

interface ShareRowsParams {
  connectionString: string
  dialect: Dialect
  limit: number
  offset: number
  share: { id: string; updatedAt: Date }
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
}: ShareRowsParams) => {
  let query = coldDialects[dialect]()
    .withSchema(view.schema)
    .$extendTables<Record<string, Record<string, unknown>>>()
    .selectFrom(view.table)
    .select(view.columns)

  if (view.filters.length > 0) {
    query = query.where((eb) =>
      toKyselyFilter(
        eb,
        view.filters,
        'AND',
        filterBindings[dialect]?.(view.columnTypes)
      )
    )
  }

  for (const [column, direction] of sort
    ? [[sort.column, sort.direction] as const]
    : Object.entries(view.orderBy)) {
    query = query.orderBy(column, direction === 'ASC' ? 'asc' : 'desc')
  }

  const compiled = query.limit(limit).offset(offset).compile()
  const { result } = await executors[dialect].execute(
    dialect === Dialect.ClickHouse
      ? { connectionString, query: prepareQuery(compiled), values: [] }
      : {
          connectionString,
          query: compiled.sql,
          values: [...compiled.parameters],
        }
  )

  return { fetchedAt: new Date(), rows: result[0]?.rows ?? [] }
}

const cachedRead = (maxAge: number) =>
  memoize(readShareRows, {
    cacheKey: ({ limit, offset, share, sort }) =>
      JSON.stringify([share.id, share.updatedAt, limit, offset, sort]),
    maxAge,
  })

export const shareRows: Record<ShareRefresh, typeof readShareRows> = {
  [ShareRefresh.Day]: cachedRead(SHARE_REFRESH_MS.day),
  [ShareRefresh.Hour]: cachedRead(SHARE_REFRESH_MS.hour),
  [ShareRefresh.Live]: cachedRead(SHARE_REFRESH_MS.live),
  [ShareRefresh.Minute]: cachedRead(SHARE_REFRESH_MS.minute),
}

// memoza never evicts an expired key, so without this every page ever viewed stays in memory.
setInterval(() => {
  for (const read of Object.values(shareRows)) {
    clearMemoizeCache(read)
  }
}, SHARE_REFRESH_MS.day)
