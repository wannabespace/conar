import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseRowsQuery, useDatabase } from '~/entities/database'
import { Route, usePageContext } from '..'

export function useRowsQueryOpts() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const { store } = usePageContext()
  const [filters, orderBy] = useStore(store, state => [state.filters, state.orderBy])

  return useMemo(() => ({
    ...databaseRowsQuery(
      database,
      table,
      schema,
      {
        filters,
        orderBy,
      },
    ),
    throwOnError: false,
  }), [database, table, schema, filters, orderBy])
}
