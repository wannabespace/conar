import type { PageSize } from '~/components/table'
import { Separator } from '@connnect/ui/components/separator'
import { useStore } from '@tanstack/react-store'
import { useEffect, useState } from 'react'
import { TableFooter } from '~/components/table'
import { databaseRowsQuery, useDatabase, useDatabaseTableTotal } from '~/entities/database'
import { queryClient } from '~/main'
import { Route, usePageStoreContext } from '..'

export function Footer() {
  const { id, table, schema } = Route.useParams()
  const { data: database } = useDatabase(id)
  const store = usePageStoreContext()
  const [page, pageSize, filters, orderBy] = useStore(store, state => [state.page, state.pageSize, state.filters, state.orderBy])
  const { data: total } = useDatabaseTableTotal(database, table, schema, {
    filters,
  })
  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page - 1, pageSize, filters, orderBy }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page + 1, pageSize, filters, orderBy }))
  }, [page, pageSize, canPrefetch])

  if (!total || total < (50 satisfies PageSize)) {
    return null
  }

  return (
    <div
      className="flex flex-col bg-muted/20"
      onMouseEnter={() => setCanPrefetch(true)}
      onMouseLeave={() => setCanPrefetch(false)}
    >
      <Separator className="h-[2px]" />
      <TableFooter
        className="p-2"
        currentPage={page}
        onPageChange={page => store.setState(state => ({
          ...state,
          page,
          selected: [],
        }))}
        pageSize={pageSize}
        onPageSizeChange={pageSize => store.setState(state => ({
          ...state,
          page: 1,
          pageSize,
        }))}
        total={total}
      />
    </div>
  )
}
