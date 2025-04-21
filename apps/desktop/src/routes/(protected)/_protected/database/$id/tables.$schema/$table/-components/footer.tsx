import type { PageSize } from '~/entities/database'
import { Separator } from '@connnect/ui/components/separator'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useState } from 'react'
import { databaseRowsQuery, DataTableFooter, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { tableStore } from '..'

export function TableFooter() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { data } = useQuery(databaseRowsQuery(database, table, schema, { page: 1, limit: 50 }))
  const [page, pageSize] = useStore(tableStore, state => [state.page, state.pageSize])
  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page - 1, limit: pageSize }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page + 1, limit: pageSize }))
  }, [page, pageSize, canPrefetch])

  if (!data || data.total < (50 satisfies PageSize)) {
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
        onPageChange={page => tableStore.setState(state => ({ ...state, page }))}
        pageSize={pageSize}
        onPageSizeChange={pageSize => tableStore.setState(state => ({ ...state, page: 1, pageSize }))}
        total={data.total ?? 0}
      />
    </div>
  )
}
