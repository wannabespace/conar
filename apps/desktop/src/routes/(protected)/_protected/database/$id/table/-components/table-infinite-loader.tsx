import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { useIsInViewport } from '@conar/ui/hookas/use-is-in-viewport'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiLoaderLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useTableContext } from '~/components/table'
import { databaseRowsQuery } from '~/entities/database'
import { TableEmpty } from './table-empty'

export function TableInfiniteLoader({
  table,
  schema,
  database,
  filters,
  orderBy,
}: {
  table: string
  schema: string
  database: typeof databases.$inferSelect
  filters: ActiveFilter[]
  orderBy: Record<string, 'ASC' | 'DESC'>
}) {
  const { fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
    databaseRowsQuery({ database, table, schema, query: { filters, orderBy } }),
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
    <div className="sticky left-0 h-80 pointer-events-none">
      <div ref={loaderRef} className="absolute h-[calc(50vh+50rem)] bottom-0 inset-x-0" />
      <div className="flex items-center justify-center h-[inherit]">
        {hasNextPage
          ? <RiLoaderLine className="size-10 animate-spin opacity-50" />
          : <TableEmpty className="bottom-0 h-full" title="No more data" description="This table has no more rows" />}
      </div>
    </div>
  )
}
