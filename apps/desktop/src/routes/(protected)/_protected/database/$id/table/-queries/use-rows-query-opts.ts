import { useStore } from '@tanstack/react-store'
import { useMemo } from 'react'
import { databaseRowsQuery } from '~/entities/database'
import { Route, usePageStoreContext } from '..'

export function useRowsQueryOpts({ table, schema }: { table: string, schema: string }) {
  const { database } = Route.useLoaderData()
  const store = usePageStoreContext()
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
