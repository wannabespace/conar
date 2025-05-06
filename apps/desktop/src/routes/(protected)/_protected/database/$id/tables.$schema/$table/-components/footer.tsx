import type { PageSize } from '~/entities/database'
import { Separator } from '@connnect/ui/components/separator'
import { useParams } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useState } from 'react'
import { databaseRowsQuery, DataTableFooter, useDatabase, useDatabaseTableTotal, whereSql } from '~/entities/database'
import { queryClient } from '~/main'
import { useTableStoreContext } from '..'

export function Footer() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const store = useTableStoreContext()
  const [page, pageSize, filters] = useStore(store, state => [state.page, state.pageSize, state.filters])
  const { data: total } = useDatabaseTableTotal(database, table, schema, {
    where: whereSql(filters)[database.type],
  })
  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page - 1, limit: pageSize }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page + 1, limit: pageSize }))
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
      <DataTableFooter
        className="p-2"
        currentPage={page}
        onPageChange={page => store.setState(state => ({
          ...state,
          page,
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
