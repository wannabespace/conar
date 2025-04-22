import type { Dispatch, SetStateAction } from 'react'
import type { PageSize } from '~/entities/database'
import { Separator } from '@connnect/ui/components/separator'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { databaseRowsQuery, databaseTableTotalQuery, DataTableFooter, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'

export function Footer({
  page,
  pageSize,
  setPage,
  setPageSize,
}: {
  page: number
  pageSize: PageSize
  setPage: Dispatch<SetStateAction<number>>
  setPageSize: Dispatch<SetStateAction<PageSize>>
}) {
  const { id, table, schema } = useParams({ from: '/(protected)/_protected/database/$id/tables/$schema/$table/' })
  const { data: database } = useDatabase(id)
  const { data: total } = useSuspenseQuery(databaseTableTotalQuery(database, table, schema))
  const [canPrefetch, setCanPrefetch] = useState(false)

  useEffect(() => {
    if (!canPrefetch)
      return

    if (page - 1 > 0) {
      queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page - 1, limit: pageSize }))
    }
    queryClient.ensureQueryData(databaseRowsQuery(database, table, schema, { page: page + 1, limit: pageSize }))
  }, [page, pageSize, canPrefetch])

  if (total < (50 satisfies PageSize)) {
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
        onPageSizeChange={(pageSize) => {
          setPage(1)
          setPageSize(pageSize)
        }}
        total={total}
      />
    </div>
  )
}
