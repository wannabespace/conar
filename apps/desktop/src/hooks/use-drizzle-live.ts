// Most of this code is copied from https://gist.github.com/Makisuo/cadc53ec96d46398d439321aad536a4e

/* eslint-disable ts/no-explicit-any */
import type { BuildRelationalQueryResult, TableRelationalConfig, TablesRelationalConfig } from 'drizzle-orm'
import type { PgRelationalQuery } from 'drizzle-orm/pg-core/query-builders/query'
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { Store, useStore } from '@tanstack/react-store'
import { Column, is, One, SQL } from 'drizzle-orm'
import { useMemo } from 'react'
import { db as drizzle, pg } from '~/drizzle'

function mapRelationalRow(
  tablesConfig: TablesRelationalConfig,
  tableConfig: TableRelationalConfig,
  row: unknown[],
  buildQueryResultSelection: BuildRelationalQueryResult['selection'],
  mapColumnValue: (value: unknown) => unknown = value => value,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [selectionItemIndex, selectionItem] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey]!
      const rawSubRows = row[selectionItemIndex] as unknown[] | null | [null] | string
      const subRows = typeof rawSubRows === 'string' ? (JSON.parse(rawSubRows) as unknown[]) : rawSubRows
      result[selectionItem.tsKey] = is(relation, One)
        ? subRows
        && mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey!]!,
          subRows,
          selectionItem.selection,
          mapColumnValue,
        )
        : (subRows as unknown[][]).map(subRow =>
            mapRelationalRow(
              tablesConfig,
              tablesConfig[selectionItem.relationTableTsKey!]!,
              subRow,
              selectionItem.selection,
              mapColumnValue,
            ),
          )
    }
    else {
      const value = mapColumnValue(row[selectionItemIndex])
      const field = selectionItem.field!
      let decoder: any
      if (is(field, Column)) {
        decoder = field
      }
      else if (is(field, SQL)) {
        // @ts-expect-error Internal field
        decoder = field.decoder
      }
      else {
        // @ts-expect-error Internal field
        decoder = field.sql.decoder
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value)
    }
  }

  return result
}

function processQueryResults<T>(query: T, rawRows: any[]) {
  return rawRows.map((row) => {
    return mapRelationalRow(
      (query as any).schema,
      (query as any).tableConfig,
      Object.values(row),
      (query as any)._getQuery().selection,
    )
  })
}

const drizzleStore = new Store<{
  [key: string]: unknown
}>({})

export function useDrizzleLive<T extends PgRelationalQuery<unknown>>({ fn, enabled }: {
  fn: (db: typeof drizzle['query']) => T
  enabled?: boolean
}) {
  const q = useMemo(() => fn(drizzle.query), [fn])
  const sql = q.toSQL()
  const key = useMemo(() => ['drizzle-live', sql.sql, sql.params.map(String).join('-')].join('-'), [sql.sql, sql.params])
  const data = useStore(drizzleStore, state => state[key] as T['_']['result'] || null)

  useAsyncEffect(async () => {
    if (enabled === false) {
      return
    }

    const live = await pg.live.query(sql.sql, sql.params, (results) => {
      const processed = processQueryResults(q, results.rows)

      drizzleStore.setState(state => ({
        ...state,
        [key]: (q as unknown as { mode: string }).mode === 'first' ? processed[0] : processed,
      }))
    })

    return () => {
      live.unsubscribe()
    }
  }, [fn, enabled])

  return { data }
}
