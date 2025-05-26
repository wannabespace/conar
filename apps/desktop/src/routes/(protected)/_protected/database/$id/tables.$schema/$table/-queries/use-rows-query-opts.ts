import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseRowsQuery, useDatabase } from '~/entities/database'
import { Route, usePageStoreContext } from '..'

export function useRowsQueryOpts() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const store = usePageStoreContext()
  const [page, pageSize, filters, orderBy] = useStore(store, state => [state.page, state.pageSize, state.filters, state.orderBy])

  return useMemo(() => ({
    ...databaseRowsQuery(
      database,
      table,
      schema,
      {
        page,
        pageSize,
        filters,
        orderBy,
      },
    ),
    throwOnError: false,
  }), [
    database,
    table,
    schema,
    page,
    pageSize,
    filters,
    orderBy,
  ])
}
