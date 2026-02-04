import type { ActiveFilter } from '@conar/shared/filters'
import type { connections } from '~/drizzle'
import { useTableContext } from '@conar/table'
import { useIsInViewport } from '@conar/ui/hookas/use-is-in-viewport'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiLoaderLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { connectionRowsQuery } from '~/entities/connection/queries'
import { TableEmpty } from './table-empty'

export function TableInfiniteLoader({
  table,
  schema,
  connection,
  filters,
  orderBy,
}: {
  table: string
  schema: string
  connection: typeof connections.$inferSelect
  filters: ActiveFilter[]
  orderBy: Record<string, 'ASC' | 'DESC'>
}) {
  const { fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
    connectionRowsQuery({ connection, table, schema, query: { filters, orderBy } }),
  )
  const loaderRef = useRef<HTMLDivElement>(null)
  const isVisible = useIsInViewport(loaderRef)

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [isVisible, hasNextPage, isFetching, fetchNextPage])

  const scrollRef = useTableContext(state => state.scrollRef)
  useMountedEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollRef, filters, orderBy])

  return (
    <div className="pointer-events-none sticky left-0 h-80">
      <div
        ref={loaderRef}
        className="absolute inset-x-0 bottom-0 h-[calc(50vh+50rem)]"
      />
      <div className="flex h-[inherit] items-center justify-center">
        {hasNextPage
          ? <RiLoaderLine className="size-10 animate-spin opacity-50" />
          : <TableEmpty className="bottom-0 h-full" title="No more data" description="This table has no more rows" />}
      </div>
    </div>
  )
}
