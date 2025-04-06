import { Separator } from '@connnect/ui/components/separator'
import { useParams } from '@tanstack/react-router'
import { use, useEffect, useState } from 'react'
import { databaseRowsQuery, DataTableFooter, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { TableContext } from '..'

export function TableFooter() {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { page, setPage, pageSize, total, setPageSize } = use(TableContext)
  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    setPageSize(50)
  }, [table])

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page - 1, limit: pageSize }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page + 1, limit: pageSize }))
  }, [page, pageSize, canPrefetch])

  if (!total || total < 50) {
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
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(value) => {
          setPage(1)
          setPageSize(value)
        }}
        total={total ?? 0}
      />
    </div>
  )
}
