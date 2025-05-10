import { useParams } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseRowsQuery, useDatabase, whereSql } from '~/entities/database'
import { useTableStoreContext } from '..'

export function useRowsQueryOpts() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const store = useTableStoreContext()
  const [page, pageSize, filters, orderBy] = useStore(store, state => [state.page, state.pageSize, state.filters, state.orderBy])
  const where = useMemo(() => whereSql(filters)[database.type], [filters, database.type])

  return useMemo(() => ({
    ...databaseRowsQuery(
      database,
      table,
      schema,
      {
        page,
        limit: pageSize,
        where,
        orderBy,
      },
    ),
    throwOnError: false,
  }), [database, table, schema, page, pageSize, where, orderBy])
}
