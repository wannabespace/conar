import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseRowsQuery, useDatabase, whereSql } from '~/entities/database'
import { Route, usePageStoreContext } from '..'

export function useRowsQueryOpts() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const store = usePageStoreContext()
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
