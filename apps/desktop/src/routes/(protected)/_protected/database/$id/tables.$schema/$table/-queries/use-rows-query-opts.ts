import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseRowsQuery } from '~/entities/database'
import { Route, usePageContext } from '..'

export function useRowsQueryOpts() {
  const { table, schema } = Route.useParams()
  const { database } = Route.useLoaderData()
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
